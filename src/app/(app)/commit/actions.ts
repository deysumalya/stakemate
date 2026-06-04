'use server'

import { createClient } from "@/utils/supabase/server";
import { negotiateGoalWithAI } from "@/utils/ai/claude";
import { redirect } from "next/navigation";

export async function negotiateGoalAction(goalText: string, proofDescription: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Call the Claude AI Interrogator
  try {
    const response = await negotiateGoalWithAI(goalText, proofDescription);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("AI Negotiation Error:", error);
    return { success: false, error: "AI failed to respond. Please try again." };
  }
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
  await supabase.from('users').update({
    available_balance: newAvailable,
    pledged_balance: newPledged
  }).eq('id', user.id);
  
  // 3. Log transaction
  await supabase.from('wallet_transactions').insert({
    user_id: user.id,
    type: 'pledge',
    amount: pledgeAmountPaise,
    balance_after: newAvailable,
    notes: 'Pledged for goal: ' + goalText.substring(0, 50)
  });
  
  // 4. Save Goal
  await supabase.from('goals').insert({
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
  
  redirect('/dashboard');
}
