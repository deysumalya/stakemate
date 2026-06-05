'use server'

import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. Admin Login Server Action
export async function verifyAdmin2FA(formData: FormData) {
  const secretKey = formData.get("secretKey") as string;
  
  // Hardcoded for the prototype/MVP. You should set this in Vercel Environment Variables.
  const expectedKey = process.env.ADMIN_SECRET_KEY || "123456";

  if (secretKey === expectedKey) {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // The user MUST also be authenticated with the correct email
    if (user && user.email === "sumalyadey1@gmail.com") {
      const cookieStore = await cookies();
      cookieStore.set("admin_2fa_session", "verified", {
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
  const cookieStore = await cookies();
  cookieStore.delete("admin_2fa_session");
  redirect("/admin/login");
}

// 2. Admin Goal Resolution Actions
export async function adminResolveGoal(reportId: string, goalId: string, userId: string, verdict: 'pass' | 'fail', pledgeAmount: number) {
  const supabaseAuth = await createServerClient();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_2fa_session");

  // Verify Admin Authentication strictly
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== "sumalyadey1@gmail.com" || sessionCookie?.value !== "verified") {
    return { success: false, error: "Admin strictly unauthorized" };
  }

  // We rely on Supabase RLS policies to grant admin powers to this email,
  // so we can just use the authenticated client for all operations.

  if (verdict === 'pass') {
    // 1. Mark report as resolved
    await supabaseAuth.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    
    // 2. Mark goal as resolved_pass
    await supabaseAuth.from('goals').update({ status: 'resolved_pass' }).eq('id', goalId);
    
    // 3. Refund the money to available balance (since it was deducted upon failure)
    // First get current balance
    const { data: userData } = await supabaseAuth.from('users').select('available_balance').eq('id', userId).single();
    if (userData) {
      const newBalance = userData.available_balance + pledgeAmount;
      await supabaseAuth.from('users').update({ available_balance: newBalance }).eq('id', userId);

      // Log wallet transaction as refund
      await supabaseAuth.from('wallet_transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: pledgeAmount,
        balance_after: newBalance,
        notes: `Admin Override Refund for Goal ${goalId}`
      });
    }

  } else if (verdict === 'fail') {
    // 1. Mark report as resolved
    await supabaseAuth.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    
    // 2. Mark goal as resolved_fail
    // If it was already failed/forfeited, we don't need to deduct money again. 
    await supabaseAuth.from('goals').update({ status: 'resolved_fail' }).eq('id', goalId);
  }

  return { success: true };
}
