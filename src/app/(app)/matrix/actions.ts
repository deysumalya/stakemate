'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function fulfillMatrixRequestAction(requestId: string, responseJson: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  try {
    const parsed = JSON.parse(responseJson);

    // Fetch the original request to check if it's a PROOF_JUDGMENT
    const { data: matrixReq } = await supabase
      .from('matrix_requests')
      .select('user_prompt, user_id')
      .eq('id', requestId)
      .single();

    if (matrixReq) {
      let isProofJudgment = false;
      let isMcqGeneration = false;
      let goalId = null;

      try {
        const promptJson = JSON.parse(matrixReq.user_prompt);
        if (promptJson.goal_id) {
          goalId = promptJson.goal_id;
          if (promptJson.type === "PROOF_JUDGMENT") {
            isProofJudgment = true;
          } else if (promptJson.type === "MCQ_GENERATION") {
            isMcqGeneration = true;
          }
        }
      } catch (e) {
        // Not a JSON prompt, probably negotiation or topic verification
      }

      if (isMcqGeneration && goalId) {
        await supabase.from('goals').update({
          mcq_json: parsed,
          status: 'in_quiz'
        }).eq('id', goalId);
      } else if (isProofJudgment && goalId) {
        const isPassed = parsed.verdict === "PASS";

        // Fetch user info for balance
        const { data: userData } = await supabase.from('users')
          .select('available_balance, pledged_balance, streak, consecutive_fails')
          .eq('id', matrixReq.user_id)
          .single();

        const { data: goal } = await supabase.from('goals')
          .select('pledge_amount, goal_text')
          .eq('id', goalId)
          .single();

        if (userData && goal) {
          const pledgeAmount = goal.pledge_amount || 0;

          if (isPassed) {
            await supabase.from('users').update({
              available_balance: userData.available_balance + pledgeAmount,
              pledged_balance: userData.pledged_balance - pledgeAmount,
              streak: userData.streak + 1,
              consecutive_fails: 0
            }).eq('id', matrixReq.user_id);

            await supabase.from('wallet_transactions').insert({
              user_id: matrixReq.user_id,
              type: 'unlock',
              amount: pledgeAmount,
              balance_after: userData.available_balance + pledgeAmount,
              notes: 'Passed: ' + goal.goal_text.substring(0, 50)
            });
          } else {
            await supabase.from('users').update({
              pledged_balance: userData.pledged_balance - pledgeAmount,
              streak: 0,
              consecutive_fails: userData.consecutive_fails + 1
            }).eq('id', matrixReq.user_id);

            await supabase.from('wallet_transactions').insert({
              user_id: matrixReq.user_id,
              type: 'forfeit',
              amount: pledgeAmount,
              balance_after: userData.available_balance,
              notes: 'Failed: ' + goal.goal_text.substring(0, 50)
            });
          }

          // Resolve the goal
          await supabase.from('goals').update({
            verdict_json: parsed,
            status: isPassed ? 'resolved_pass' : 'resolved_fail',
            resolved_at: new Date().toISOString()
          }).eq('id', goalId);
        }
      }
    }

    const { error } = await supabase
      .from('matrix_requests')
      .update({
        response_json: parsed,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
    
    revalidatePath('/matrix');
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to fulfill request" };
  }
}
