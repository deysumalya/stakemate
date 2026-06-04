import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: goals, error: goalsError } = await supabase.from('goals').select('*').order('created_at', { ascending: false }).limit(5);
  const { data: users, error: usersError } = await supabase.from('users').select('*').limit(5);
  const { data: txs, error: txsError } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(5);

  return NextResponse.json({
    goals,
    goalsError,
    users,
    usersError,
    txs,
    txsError
  });
}
