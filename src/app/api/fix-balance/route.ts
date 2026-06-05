import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ pledged_balance: 0 })
    .eq('id', user.id)
    .select();

  return NextResponse.json({
    success: true,
    fixed_users: data,
    error
  });
}
