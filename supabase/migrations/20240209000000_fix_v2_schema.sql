-- Fix 1: Rename stake_amount to pledge_amount in goals table
ALTER TABLE public.goals RENAME COLUMN stake_amount TO pledge_amount;

-- Fix 2: Allow users to insert wallet transactions (RLS was blocking the pledge deduction log)
DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can insert own wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
