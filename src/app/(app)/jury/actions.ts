'use server'

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function castVote(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const goalId = formData.get("goalId") as string;
  const vote = formData.get("vote") as string; // 'pass' or 'fail'
  const isHoneypot = formData.get("isHoneypot") === 'true';

  if (!goalId || !vote) {
    redirect('/jury?warning=Missing required fields');
  }

  if (isHoneypot) {
    const expectedVerdict = formData.get("expectedVerdict") as string;
    
    // Check honeypot result
    if (vote !== expectedVerdict) {
      // User failed honeypot - reset tally
      await supabase
        .from('users')
        .update({
          correct_vote_tally: 0,
        })
        .eq('id', user.id);
        
      // Also increment fails (in a real app we'd use an rpc call)
      const { data: userData } = await supabase.from('users').select('honeypot_fails_this_month').eq('id', user.id).single();
      const currentFails = userData?.honeypot_fails_this_month || 0;
      await supabase.from('users').update({ honeypot_fails_this_month: currentFails + 1 }).eq('id', user.id);

      redirect('/jury?warning=You failed a honeypot check. Your correct vote tally has been reset.');
    } else {
      // Passed honeypot, just record vote and move on
      await supabase.from('jury_votes').insert({
        goal_id: goalId,
        juror_id: user.id,
        vote: vote,
        is_honeypot: true
      });
    }
  } else {
    // Normal vote
    const { error } = await supabase
      .from('jury_votes')
      .insert({
        goal_id: goalId,
        juror_id: user.id,
        vote: vote,
        is_honeypot: false
      });

    if (error) {
      redirect('/jury?warning=' + error.message);
    }

    // Process consensus check (in a robust app, this is an Edge Function or Database Trigger)
    // For V1, we check if there are 3 votes now
    const { count } = await supabase
      .from('jury_votes')
      .select('*', { count: 'exact' })
      .eq('goal_id', goalId)
      .eq('is_honeypot', false);

    if (count === 3) {
      // Fetch all votes
      const { data: votes } = await supabase
        .from('jury_votes')
        .select('vote, juror_id')
        .eq('goal_id', goalId)
        .eq('is_honeypot', false);

      if (votes) {
        const passCount = votes.filter(v => v.vote === 'pass').length;
        const failCount = votes.filter(v => v.vote === 'fail').length;
        const finalVerdict = passCount > failCount ? 'pass' : 'fail';

        // Update goal verdict
        await supabase
          .from('goals')
          .update({
            status: finalVerdict,
            verdict_at: new Date().toISOString()
          })
          .eq('id', goalId);

        // Update correct tally for jurors who matched consensus
        for (const v of votes) {
          if (v.vote === finalVerdict) {
            // They matched consensus, increase tally (skip RPC for pure Supabase JS V1 if it's missing, let's just do a direct update)
            const { data: jurData } = await supabase.from('users').select('correct_vote_tally').eq('id', v.juror_id).single();
            const currentTally = jurData?.correct_vote_tally || 0;
            await supabase.from('users').update({ correct_vote_tally: currentTally + 1 }).eq('id', v.juror_id);
            await supabase.from('jury_votes').update({ matched_consensus: true }).eq('goal_id', goalId).eq('juror_id', v.juror_id);
          } else {
            await supabase.from('jury_votes').update({ matched_consensus: false }).eq('goal_id', goalId).eq('juror_id', v.juror_id);
          }
        }
      }
    }
  }

  revalidatePath('/jury');
  redirect('/jury');
}
