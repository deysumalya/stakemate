-- Stakemate Schema

-- 1. users table (links to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  interest_category TEXT,
  subscription_status TEXT DEFAULT 'free_trial',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  correct_vote_tally INTEGER DEFAULT 0,
  honeypot_fails_this_month INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  goal_text TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  stake_amount NUMERIC NOT NULL,
  stake_type TEXT DEFAULT 'virtual',
  proof_url TEXT,
  proof_type TEXT,
  status TEXT DEFAULT 'active', -- active, pass, fail, expired
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  verdict_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Users can read their own goals, and jurors can read goals pending review (we'll make a view/function for this, or just allow read for all authenticated users for now)
CREATE POLICY "Authenticated users can read goals" ON public.goals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. jury_votes table
CREATE TABLE public.jury_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) NOT NULL,
  juror_id UUID REFERENCES public.users(id) NOT NULL,
  vote TEXT NOT NULL, -- 'pass' or 'fail'
  is_honeypot BOOLEAN DEFAULT FALSE,
  matched_consensus BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goal_id, juror_id)
);

ALTER TABLE public.jury_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own votes" ON public.jury_votes
  FOR SELECT USING (auth.uid() = juror_id);

CREATE POLICY "Users can insert their own votes" ON public.jury_votes
  FOR INSERT WITH CHECK (auth.uid() = juror_id);

-- 4. honeypot_proofs table
CREATE TABLE public.honeypot_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_text TEXT NOT NULL,
  proof_url TEXT NOT NULL,
  expected_verdict TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.honeypot_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read honeypots" ON public.honeypot_proofs FOR SELECT USING (true);

-- 5. disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT DEFAULT 'pending',
  claude_verdict TEXT,
  claude_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Setup Storage Bucket for Proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);

CREATE POLICY "Authenticated users can upload proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proofs' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');
