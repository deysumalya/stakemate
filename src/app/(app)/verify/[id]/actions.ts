'use server'

import { createClient } from "@/utils/supabase/server";
import { generateMCQs, judgeProofWithVision } from "@/utils/ai/claude";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { MCQ_GENERATION_PROMPT } from "@/utils/ai/prompts";

export async function generateQuizAction(goalId: string, topicList: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const userPrompt = JSON.stringify({
    type: "MCQ_GENERATION",
    goal_id: goalId,
    topics: topicList
  }, null, 2);

  const { data: matrixReq, error: matrixErr } = await supabase
    .from('matrix_requests')
    .insert({
      user_id: user.id,
      system_prompt: MCQ_GENERATION_PROMPT,
      user_prompt: userPrompt,
      status: 'pending'
    })
    .select('id')
    .single();

  if (matrixErr) {
    console.error("Matrix Insert Error:", matrixErr);
    throw new Error("Failed to queue MCQ request");
  }

  // Set goal status to waiting_quiz (or keep it active, but we need to know it's pending)
  // Let's just return the matrix request ID
  return { success: true, matrixRequestId: matrixReq.id };
}

export async function submitProofAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const goalId = formData.get('goalId') as string;
  const category = formData.get('category') as string;
  const userAnswersRaw = formData.get('userAnswers') as string;
  const userAnswers = userAnswersRaw ? JSON.parse(userAnswersRaw) : null;

  // Upload proof images
  const proofUrls: string[] = [];
  const files = formData.getAll('proofFiles') as File[];

  for (const file of files) {
    if (file.size === 0) continue;
    const fileName = `${user.id}/${goalId}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      continue;
    }

    const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(fileName);
    proofUrls.push(urlData.publicUrl);
  }

  // Update goal with proof URLs and user answers
  await supabase.from('goals').update({
    proof_urls: proofUrls,
    user_answers: userAnswers,
    status: 'judging',
    submitted_at: new Date().toISOString()
  }).eq('id', goalId).eq('user_id', user.id);

  // Fetch the full goal for context
  const { data: goal } = await supabase.from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (!goal) throw new Error("Goal not found");

  // Call Claude Vision to judge - MOVED TO MATRIX
  const { VISION_JUDGMENT_PROMPT } = await import('@/utils/ai/prompts');
  const userPrompt = JSON.stringify({
    type: "PROOF_JUDGMENT",
    goal_id: goalId,
    category: category,
    proofUrls: proofUrls,
    topicList: goal.topic_list || undefined,
    userAnswers: userAnswers,
    mcqJson: goal.mcq_json || undefined
  }, null, 2);

  const { error: matrixErr } = await supabase
    .from('matrix_requests')
    .insert({
      user_id: user.id,
      system_prompt: VISION_JUDGMENT_PROMPT,
      user_prompt: userPrompt,
      status: 'pending'
    });

  if (matrixErr) {
    console.error("Matrix Insert Error:", matrixErr);
    throw new Error("Failed to queue Proof Judgment request");
  }

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/dashboard');
}
