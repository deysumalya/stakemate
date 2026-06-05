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
    .select("id, goal_text, status, category, deadline, proof_urls, user_answers, topic_list, mcq_json, pledge_amount, created_at, negotiation_json, proof_description")
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

  // For any goal that is in judging/active/in_quiz, offer to requeue
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

    // Build MCQ score data
    let mcqAnswerData = null;
    if (goal.mcq_json?.questions && goal.user_answers) {
      mcqAnswerData = goal.mcq_json.questions.map((q: any, i: number) => ({
        question: q.question,
        correct_answer: q.correct_answer,
        user_answer: goal.user_answers[i] || "not answered",
        is_correct: goal.user_answers[i] === q.correct_answer
      }));
    }

    const userPrompt = JSON.stringify({
      type: "PROOF_JUDGMENT",
      goal_id: goal.id,
      goal_text: goal.goal_text,
      category: goal.category,
      negotiated_proof_description: goal.negotiation_json?.negotiated_proof_description || goal.proof_description || "No specific proof was negotiated",
      verification_requirements: goal.negotiation_json?.verification_requirements || [],
      proofUrls: goal.proof_urls || [],
      topicList: goal.topic_list || undefined,
      mcq_answers: mcqAnswerData,
      mcq_correct_count: mcqAnswerData ? mcqAnswerData.filter((a: any) => a.is_correct).length : null,
      mcq_total: mcqAnswerData ? mcqAnswerData.length : null
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
