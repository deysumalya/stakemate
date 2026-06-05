'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. Admin Login Server Action
export async function verifyAdmin2FA(formData: FormData) {
  const secretKey = formData.get("secretKey") as string;
  
  // Hardcoded for the prototype/MVP. You should set this in Vercel Environment Variables.
  const expectedKey = process.env.ADMIN_SECRET_KEY || "123456";

  if (secretKey === expectedKey) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // The user MUST also be authenticated with the correct email
    if (user && user.email === "sumalyadey@gmail.com") {
      cookies().set("admin_2fa_session", "verified", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 2, // 2 hours
        path: "/",
      });
      return { success: true };
    } else {
      return { success: false, error: "Unauthorized email address." };
    }
  }

  return { success: false, error: "Invalid Admin Secret Key." };
}

export async function adminLogout() {
  cookies().delete("admin_2fa_session");
  redirect("/admin/login");
}

// 2. Admin Goal Resolution Actions
export async function adminResolveGoal(reportId: string, goalId: string, userId: string, verdict: 'pass' | 'fail', pledgeAmount: number) {
  const supabase = await createClient();
  const sessionCookie = cookies().get("admin_2fa_session");

  // Verify Admin Authentication strictly
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== "sumalyadey@gmail.com" || sessionCookie?.value !== "verified") {
    return { success: false, error: "Admin strictly unauthorized" };
  }

  if (verdict === 'pass') {
    // 1. Mark report as resolved
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    
    // 2. Mark goal as resolved_pass
    await supabase.from('goals').update({ status: 'resolved_pass', effective_status: 'pass' }).eq('id', goalId);
    
    // 3. Refund the money to available balance (since it was deducted upon failure)
    // First get current balance
    const { data: userData } = await supabase.from('users').select('available_balance').eq('id', userId).single();
    if (userData) {
      const newBalance = userData.available_balance + pledgeAmount;
      await supabase.from('users').update({ available_balance: newBalance }).eq('id', userId);

      // Log wallet transaction as refund
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: pledgeAmount,
        balance_after: newBalance,
        notes: `Admin Override Refund for Goal ${goalId}`
      });
    }

  } else if (verdict === 'fail') {
    // 1. Mark report as resolved
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    
    // 2. Mark goal as resolved_fail
    // If it was already failed/forfeited, we don't need to deduct money again. 
    await supabase.from('goals').update({ status: 'resolved_fail', effective_status: 'fail' }).eq('id', goalId);
  }

  return { success: true };
}
