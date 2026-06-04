'use server'

import { createClient } from "@/utils/supabase/server";
import { generateMCQs, judgeProofWithVision } from "@/utils/ai/claude";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function generateQuizAction(goalId: string, topicList: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Generate MCQs
  const mcqJson = await generateMCQs(topicList);

  // Save to goal & update status
  await supabase.from('goals').update({
    mcq_json: mcqJson,
    status: 'in_quiz'
  }).eq('id', goalId).eq('user_id', user.id);

  return mcqJson;
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

  // Call Claude Vision to judge
  let verdictJson;
  try {
    verdictJson = await judgeProofWithVision(
      category,
      proofUrls,
      {
        topicList: goal.topic_list || undefined,
        userAnswers: userAnswers,
        mcqJson: goal.mcq_json || undefined
      }
    );
  } catch (e) {
    console.error("Claude Vision error:", e);
    verdictJson = { verdict: "FAIL", reasoning: "AI judge could not process the proof. Please try again.", mcq_score: 0, work_quality: "insufficient" };
  }

  const isPassed = verdictJson.verdict === "PASS";

  // Resolve the goal
  await supabase.from('goals').update({
    verdict_json: verdictJson,
    status: isPassed ? 'resolved_pass' : 'resolved_fail',
    resolved_at: new Date().toISOString()
  }).eq('id', goalId);

  // Update wallet balances
  const { data: userData } = await supabase.from('users')
    .select('available_balance, pledged_balance, streak, consecutive_fails')
    .eq('id', user.id)
    .single();

  if (userData) {
    const pledgeAmount = goal.pledge_amount || 0;

    if (isPassed) {
      // PASS: pledged -> available (money returns)
      await supabase.from('users').update({
        available_balance: userData.available_balance + pledgeAmount,
        pledged_balance: userData.pledged_balance - pledgeAmount,
        streak: userData.streak + 1,
        consecutive_fails: 0
      }).eq('id', user.id);

      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'unlock',
        amount: pledgeAmount,
        balance_after: userData.available_balance + pledgeAmount,
        notes: 'Passed: ' + goal.goal_text.substring(0, 50)
      });
    } else {
      // FAIL: pledged balance removed entirely (platform profit)
      await supabase.from('users').update({
        pledged_balance: userData.pledged_balance - pledgeAmount,
        streak: 0,
        consecutive_fails: userData.consecutive_fails + 1
      }).eq('id', user.id);

      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        type: 'forfeit',
        amount: pledgeAmount,
        balance_after: userData.available_balance,
        notes: 'Failed: ' + goal.goal_text.substring(0, 50)
      });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/profile');
  redirect('/dashboard');
}
