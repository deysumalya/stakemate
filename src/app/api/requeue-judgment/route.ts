import { createClient } from "@/utils/supabase/server";
import { VISION_JUDGMENT_PROMPT } from "@/utils/ai/prompts";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all goals in 'judging' status for this user
  const { data: judgingGoals, error: goalsErr } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "judging");

  if (goalsErr) {
    return NextResponse.json({ error: "Failed to fetch goals", details: goalsErr }, { status: 500 });
  }

  if (!judgingGoals || judgingGoals.length === 0) {
    return NextResponse.json({ message: "No goals in judging status found." });
  }

  const results = [];

  for (const goal of judgingGoals) {
    // Check if there's already a pending matrix request for this goal
    const { data: existingReqs } = await supabase
      .from("matrix_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .like("user_prompt", `%${goal.id}%`);

    if (existingReqs && existingReqs.length > 0) {
      results.push({ goal_id: goal.id, status: "already_queued", matrix_request_id: existingReqs[0].id });
      continue;
    }

    // Create a new matrix request
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
      results.push({ goal_id: goal.id, status: "failed", error: matrixErr });
    } else {
      results.push({ goal_id: goal.id, status: "queued", matrix_request_id: matrixReq.id });
    }
  }

  return NextResponse.json({ 
    message: `Processed ${judgingGoals.length} goal(s) in judging status.`,
    results 
  });
}
