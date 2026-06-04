'use server'

import { createClient } from "@/utils/supabase/server";
import { getNegotiationSystemPrompt } from "@/utils/ai/prompts";
import { negotiateGoalWithAI } from "@/utils/ai/claude";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function negotiateGoalAction(goalText: string, proofDescription: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch user profile data to pass as context
  const { data: userData } = await supabase
    .from('users')
    .select('occupation, target_goal')
    .eq('id', user.id)
    .single();

  const userProfile = userData ? {
    occupation: userData.occupation,
    target_goal: userData.target_goal
  } : undefined;

  try {
    // MATRIX DEV MODE: Insert into matrix_requests for the human operator
    const systemPrompt = getNegotiationSystemPrompt(userProfile);
    const userPrompt = `My goal is: "${goalText}".\nI will prove it by: "${proofDescription}".`;

    const { data: matrixReq, error: matrixErr } = await supabase
      .from('matrix_requests')
      .insert({
        user_id: user.id,
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
        status: 'pending'
      })
      .select('id')
      .single();

    if (matrixErr) {
      console.error("Matrix Insert Error:", matrixErr);
      throw new Error("Failed to queue Matrix request");
    }

    return { success: true, isMatrix: true, matrixRequestId: matrixReq.id, data: null };
  } catch (error: any) {
    console.error("AI Negotiation Error:", error);
    return { success: false, error: "AI failed to respond. Please try again.", isMatrix: false, matrixRequestId: null, data: null };
  }
}

export async function pollMatrixRequestAction(matrixRequestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('matrix_requests')
    .select('status, response_json')
    .eq('id', matrixRequestId)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (data.status === 'completed') {
    return { success: true, isComplete: true, data: data.response_json };
  }

  return { success: true, isComplete: false };
}

export async function acceptAndLockGoal(
  goalText: string, 
  proofDescription: string, 
  deadlineDate: string, 
  pledgeAmountRupees: number, 
  category: string,
  topicList: string | null,
  negotiationJson: any
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");
  
  const pledgeAmountPaise = pledgeAmountRupees * 100;
  
  // 1. Check Balance
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('available_balance, pledged_balance')
    .eq('id', user.id)
    .single();
    
  if (userError || !userData) {
    throw new Error("Could not fetch user data");
  }
  
  // Note: For V1 MVP, if they don't have balance, we can either throw error or auto-allow if they are testing. 
  // Let's enforce balance strictly once Razorpay is connected, but for right now, let's allow negative balance for easy testing.
  // Actually, let's enforce it but we haven't built the top-up page yet. We will just deduct anyway (can go negative for now in test mode).
  const newAvailable = userData.available_balance - pledgeAmountPaise;
  const newPledged = userData.pledged_balance + pledgeAmountPaise;
  
  // 2. Update balances
  const { error: updateError } = await supabase.from('users').update({
    available_balance: newAvailable,
    pledged_balance: newPledged
  }).eq('id', user.id);
  
  if (updateError) throw new Error("Failed to update balance: " + updateError.message);
  
  // 3. Log transaction
  const { error: txError } = await supabase.from('wallet_transactions').insert({
    user_id: user.id,
    type: 'pledge',
    amount: pledgeAmountPaise,
    balance_after: newAvailable,
    notes: 'Pledged for goal: ' + goalText.substring(0, 50)
  });
  
  if (txError) throw new Error("Failed to log transaction: " + txError.message);
  
  // 4. Save Goal
  const { error: goalError } = await supabase.from('goals').insert({
    user_id: user.id,
    goal_text: goalText,
    proof_description: proofDescription,
    deadline: deadlineDate, // Should be ISO string
    pledge_amount: pledgeAmountPaise,
    category: category,
    topic_list: topicList,
    negotiation_json: negotiationJson,
    status: 'active',
    locked_at: new Date().toISOString()
  });
  
  if (goalError) throw new Error("Failed to insert goal: " + goalError.message);
  
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
