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
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const goalId = formData.get('goalId') as string;
    const category = formData.get('category') as string;
    const userAnswersRaw = formData.get('userAnswers') as string;
    const userAnswers = userAnswersRaw ? JSON.parse(userAnswersRaw) : null;

    // Upload proof images — each upload is individually wrapped so one failure doesn't block everything
    const proofUrls: string[] = [];
    const files = formData.getAll('proofFiles') as File[];

    for (const file of files) {
      if (!file || file.size === 0) continue;
      try {
        const fileName = `${user.id}/${goalId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
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

    // Fallback: if storage upload failed, use base64 data URLs sent from client
    let finalProofUrls = proofUrls;
    if (proofUrls.length === 0) {
      const base64Raw = formData.get('proofBase64') as string;
      if (base64Raw) {
        try {
          finalProofUrls = JSON.parse(base64Raw) as string[];
        } catch { /* ignore parse errors */ }
      }
    }

    // Update goal with proof URLs and user answers
    const { error: updateErr } = await supabase.from('goals').update({
      proof_urls: finalProofUrls,
      user_answers: userAnswers,
      status: 'judging',
      submitted_at: new Date().toISOString()
    }).eq('id', goalId).eq('user_id', user.id);

    if (updateErr) {
      console.error("Goal update error:", updateErr);
      return { success: false, error: "Failed to update goal status" };
    }

    // Fetch the full goal for context
    const { data: goal, error: goalErr } = await supabase.from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (goalErr || !goal) return { success: false, error: "Goal not found" };

    // Build MCQ score data if applicable
    let mcqAnswerData = null;
    if (goal.mcq_json?.questions && userAnswers) {
      mcqAnswerData = goal.mcq_json.questions.map((q: any, i: number) => ({
        question: q.question,
        correct_answer: q.correct_answer,
        user_answer: userAnswers[i] || "not answered",
        is_correct: userAnswers[i] === q.correct_answer
      }));
    }

    // Insert matrix request for proof judgment
    const userPrompt = JSON.stringify({
      type: "PROOF_JUDGMENT",
      goal_id: goalId,
      goal_text: goal.goal_text,
      category: category,
      negotiated_proof_description: goal.negotiation_json?.negotiated_proof_description || goal.proof_description || "No specific proof was negotiated",
      verification_requirements: goal.negotiation_json?.verification_requirements || [],
      proofUrls: finalProofUrls,
      topicList: goal.topic_list || undefined,
      mcq_answers: mcqAnswerData,
      mcq_correct_count: mcqAnswerData ? mcqAnswerData.filter((a: any) => a.is_correct).length : null,
      mcq_total: mcqAnswerData ? mcqAnswerData.length : null
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
      return { success: false, error: "Failed to queue Proof Judgment request: " + matrixErr.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/profile');
    
    return { success: true };
  } catch (err: any) {
    console.error("Unhandled error in submitProofAction:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}
