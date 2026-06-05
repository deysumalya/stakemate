import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('users')
    .update({ pledged_balance: 0 })
    .lt('pledged_balance', 0)
    .select();

  return NextResponse.json({
    success: true,
    fixed_users: data,
    error
  });
}
