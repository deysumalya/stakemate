'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

import { MCQ_GENERATION_PROMPT, VISION_JUDGMENT_PROMPT } from "@/utils/ai/prompts";

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

  // Upload proof images — each upload is individually wrapped so one failure doesn't block everything
  const proofUrls: string[] = [];
  const files = formData.getAll('proofFiles') as File[];

  for (const file of files) {
    if (file.size === 0) continue;
    try {
      const fileName = `${user.id}/${goalId}/${Date.now()}_${file.name}`;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, buffer, { 
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(fileName);
      proofUrls.push(urlData.publicUrl);
    } catch (uploadErr) {
      console.error("File upload exception:", uploadErr);
      continue;
    }
  }

  // Update goal with proof URLs and user answers
  const { error: updateErr } = await supabase.from('goals').update({
    proof_urls: proofUrls,
    user_answers: userAnswers,
    status: 'judging',
    submitted_at: new Date().toISOString()
  }).eq('id', goalId).eq('user_id', user.id);

  if (updateErr) {
    console.error("Goal update error:", updateErr);
  }

  // Fetch the full goal for context
  const { data: goal } = await supabase.from('goals')
    .select('*')
    .eq('id', goalId)
    .single();

  if (!goal) throw new Error("Goal not found");

  // Insert matrix request for proof judgment
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
  
  // Return success instead of redirect() — redirect() throws internally
  // and gets swallowed by the client-side try/catch, causing infinite hang
  return { success: true };
}
