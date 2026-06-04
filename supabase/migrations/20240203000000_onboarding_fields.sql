-- Stakemate V2: User Onboarding Fields
-- Adds fields for personalized AI negotiation

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS target_goal TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Existing users will have onboarding_completed = FALSE, 
-- forcing them through the flow next time they log in.
