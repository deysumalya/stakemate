-- V2 Database Overhaul Migration

-- 1. DROP V1 TABLES
DROP TABLE IF EXISTS public.jury_votes CASCADE;
DROP TABLE IF EXISTS public.honeypot_proofs CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;

-- 2. ALTER USERS TABLE
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE public.users DROP COLUMN IF EXISTS subscription_expires_at;
ALTER TABLE public.users DROP COLUMN IF EXISTS correct_vote_tally;
ALTER TABLE public.users DROP COLUMN IF EXISTS honeypot_fails_this_month;
ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_customer_id;

ALTER TABLE public.users ADD COLUMN available_balance INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN pledged_balance INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN streak INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN consecutive_fails INT DEFAULT 0;
ALTER TABLE public.users ADD COLUMN razorpay_contact_id TEXT;

-- 3. ALTER GOALS TABLE
ALTER TABLE public.goals DROP COLUMN IF EXISTS stake_type;
ALTER TABLE public.goals DROP COLUMN IF EXISTS proof_url;
ALTER TABLE public.goals DROP COLUMN IF EXISTS proof_type;
ALTER TABLE public.goals DROP COLUMN IF EXISTS stripe_payment_intent_id;

-- Cast stake_amount from NUMERIC to INT in paise (if needed, assuming previous virtual was int-like, we just drop and recreate or alter type)
ALTER TABLE public.goals ALTER COLUMN stake_amount TYPE INT USING (stake_amount::INT);

ALTER TABLE public.goals ADD COLUMN category TEXT;
ALTER TABLE public.goals ADD COLUMN topic_list TEXT;
ALTER TABLE public.goals ADD COLUMN negotiation_json JSONB;
ALTER TABLE public.goals ADD COLUMN mcq_json JSONB;
ALTER TABLE public.goals ADD COLUMN user_answers JSONB;
ALTER TABLE public.goals ADD COLUMN verdict_json JSONB;
ALTER TABLE public.goals ADD COLUMN proof_urls TEXT[];
ALTER TABLE public.goals ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.goals ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;

-- Status values: negotiating, active, in_quiz, judging, resolved_pass, resolved_fail, expired
-- 4. CREATE WALLET_TRANSACTIONS TABLE
CREATE TABLE public.wallet_transactions (
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

CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 5. CREATE REDEMPTIONS TABLE
CREATE TABLE public.redemptions (
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

CREATE POLICY "Users can view own redemptions" ON public.redemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own redemptions" ON public.redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
