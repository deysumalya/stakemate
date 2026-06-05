import { createClient } from "@/utils/supabase/server";
import { VISION_JUDGMENT_PROMPT } from "@/utils/ai/prompts";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Show ALL goals for this user for debugging
  const { data: allGoals, error: goalsErr } = await supabase
    .from("goals")
    .select("id, goal_text, status, category, deadline, proof_urls, user_answers, topic_list, mcq_json, pledge_amount, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (goalsErr) {
    return NextResponse.json({ error: "Failed to fetch goals", details: goalsErr }, { status: 500 });
  }

  // Also check matrix requests
  const { data: matrixReqs } = await supabase
    .from("matrix_requests")
    .select("id, status, created_at, user_prompt")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // For any goal that is in judging/active/in_quiz and has no pending matrix PROOF_JUDGMENT request,
  // offer to requeue
  const requeueable = (allGoals || []).filter(g => 
    ["judging", "active", "in_quiz"].includes(g.status)
  );

  const results = [];

  for (const goal of requeueable) {
    // Check if there's already a pending proof judgment matrix request for this goal
    const hasExisting = (matrixReqs || []).some(r => 
      r.status === "pending" && r.user_prompt?.includes(goal.id) && r.user_prompt?.includes("PROOF_JUDGMENT")
    );

    if (hasExisting) {
      results.push({ goal_id: goal.id, action: "already_has_pending_request" });
      continue;
    }

    // Force update goal to judging and create matrix request
    await supabase.from("goals").update({ status: "judging" }).eq("id", goal.id);

    const userPrompt = JSON.stringify({
      type: "PROOF_JUDGMENT",
      goal_id: goal.id,
      category: goal.category,
      proofUrls: goal.proof_urls || [],
      topicList: goal.topic_list || undefined,
      userAnswers: goal.user_answers || undefined,
      mcqJson: goal.mcq_json || undefined
    }, null, 2);

    const { data: matrixReq, error: matrixErr } = await supabase
      .from("matrix_requests")
      .insert({
        user_id: user.id,
        system_prompt: VISION_JUDGMENT_PROMPT,
        user_prompt: userPrompt,
        status: "pending"
      })
      .select("id")
      .single();

    if (matrixErr) {
      results.push({ goal_id: goal.id, action: "requeue_failed", error: matrixErr });
    } else {
      results.push({ goal_id: goal.id, action: "requeued", matrix_request_id: matrixReq.id });
    }
  }

  return NextResponse.json({ 
    user_id: user.id,
    all_goals: allGoals,
    matrix_requests: matrixReqs,
    requeue_results: results
  });
}
