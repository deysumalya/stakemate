'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function failAbandonedQuizAction(goalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: goal } = await supabase.from('goals')
    .select('pledge_amount, status, user_id')
    .eq('id', goalId)
    .single();

  if (!goal || goal.status !== 'in_quiz') return;

  const { data: userData } = await supabase.from('users')
    .select('pledged_balance, available_balance, consecutive_fails')
    .eq('id', user.id)
    .single();

  if (userData) {
    const pledgeAmount = goal.pledge_amount || 0;
    
    // Deduct penalty
    await supabase.from('users').update({
      pledged_balance: userData.pledged_balance - pledgeAmount,
      streak: 0,
      consecutive_fails: userData.consecutive_fails + 1
    }).eq('id', user.id);

    // Log transaction
    await supabase.from('wallet_transactions').insert({
      user_id: user.id,
      type: 'forfeit',
      amount: pledgeAmount,
      balance_after: userData.available_balance,
      notes: 'Failed: Abandoned/Refreshed Quiz'
    });
  }

  // Mark goal as failed
  await supabase.from('goals').update({
    status: 'resolved_fail',
    resolved_at: new Date().toISOString(),
    verdict_json: {
      verdict: 'FAIL',
      reasoning: 'Quiz was abandoned or page was refreshed.',
      work_quality: 'insufficient'
    }
  }).eq('id', goalId);

  revalidatePath('/dashboard');
}
