'use server'

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";

export async function fileDispute(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const goalId = formData.get("goalId") as string;
  const goalText = formData.get("goalText") as string;
  const proofUrl = formData.get("proofUrl") as string;

  if (!goalId || !goalText || !proofUrl) {
    redirect('/profile?message=Missing information for dispute');
  }

  // 1. Mark dispute as pending in DB
  const { error: insertError } = await supabase
    .from('disputes')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      status: 'pending'
    });

  if (insertError) {
    redirect('/profile?message=Failed to file dispute: ' + insertError.message);
  }

  // 2. Call Claude API to judge
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 150,
      temperature: 0,
      system: `You are an impartial judge for a productivity platform called Stakemate.
A user set a goal and submitted proof. A peer jury voted to FAIL them.
The user disputes this verdict. Your job is to analyze the goal text and the
submitted proof and decide: did the user genuinely complete their stated goal?
Respond ONLY in this JSON format:
{"verdict": "PASS" or "FAIL", "reasoning": "One sentence max."}
Do not include any other text.`,
      messages: [
        {
          role: "user",
          content: `Goal: ${goalText}. Proof submitted: ${proofUrl}`
        }
      ]
    });

    // @ts-ignore
    const responseText = msg.content[0].text;
    const parsedResponse = JSON.parse(responseText);

    const claudeVerdict = parsedResponse.verdict.toLowerCase(); // 'pass' or 'fail'
    const reasoning = parsedResponse.reasoning;

    // 3. Update dispute with Claude's verdict
    await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        claude_verdict: claudeVerdict,
        claude_reasoning: reasoning,
        resolved_at: new Date().toISOString()
      })
      .eq('goal_id', goalId)
      .eq('user_id', user.id);

    // 4. Update the goal status if Claude overrides the jury to PASS
    if (claudeVerdict === 'pass') {
      await supabase
        .from('goals')
        .update({ status: 'pass' })
        .eq('id', goalId);
        
      // Future scope: update juror tally points based on Claude's override.
    }

  } catch (error: any) {
    console.error("Dispute processing failed:", error);
    // Even if Claude fails, the dispute is recorded for admin review.
  }

  revalidatePath('/profile');
  redirect('/profile?message=Dispute filed and processed.');
}
