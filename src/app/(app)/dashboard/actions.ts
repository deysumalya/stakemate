'use server'

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function loadMoney(amountRupees: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const amountPaise = amountRupees * 100;

  // 1. Fetch current balance
  const { data: userData } = await supabase
    .from('users')
    .select('available_balance')
    .eq('id', user.id)
    .single();

  const newBalance = (userData?.available_balance || 0) + amountPaise;

  // 2. Update users table
  await supabase
    .from('users')
    .update({ available_balance: newBalance })
    .eq('id', user.id);

  // 3. Insert transaction
  await supabase
    .from('wallet_transactions')
    .insert({
      user_id: user.id,
      type: 'deposit',
      amount: amountPaise,
      balance_after: newBalance,
      notes: 'Test load money'
    });

  revalidatePath('/dashboard');
}
