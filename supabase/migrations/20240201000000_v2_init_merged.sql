-- Stakemate V2 Complete Database Schema (Merged & Safe to Rerun)

-- 1. users table (links to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  category TEXT,
  available_balance INT DEFAULT 0,
  pledged_balance INT DEFAULT 0,
  streak INT DEFAULT 0,
  consecutive_fails INT DEFAULT 0,
  razorpay_contact_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  goal_text TEXT NOT NULL,
  proof_description TEXT,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  pledge_amount INT NOT NULL, -- in paise
  category TEXT,
  topic_list TEXT,
  negotiation_json JSONB,
  mcq_json JSONB,
  user_answers JSONB,
  verdict_json JSONB,
  proof_urls TEXT[],
  status TEXT DEFAULT 'negotiating', -- negotiating, active, in_quiz, judging, resolved_pass, resolved_fail, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  locked_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own goals" ON public.goals;
CREATE POLICY "Users can read own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. wallet_transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL, -- deposit, pledge, unlock, forfeit, redemption
  amount INT NOT NULL, -- in paise
  balance_after INT NOT NULL,
  razorpay_payment_id TEXT,
  reloadly_transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 4. redemptions table
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL, -- mobile_recharge, google_play
  amount INT NOT NULL,
  phone_number TEXT,
  operator TEXT,
  plan_id TEXT,
  reloadly_transaction_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, success, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON public.redemptions;
CREATE POLICY "Users can view own redemptions" ON public.redemptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own redemptions" ON public.redemptions;
CREATE POLICY "Users can insert own redemptions" ON public.redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safely recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Setup Storage Bucket for Proofs
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);
EXCEPTION
  WHEN unique_violation THEN
    -- Bucket already exists, do nothing
END $$;

-- Drop old policies to safely recreate them
DROP POLICY IF EXISTS "Authenticated users can upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view proofs" ON storage.objects;

CREATE POLICY "Authenticated users can upload proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');
