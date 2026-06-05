-- Stakemate V2: Expire missed deadlines
-- This function should be called via pg_cron every 5 minutes
-- Or manually via Supabase Edge Function / scheduled webhook

CREATE OR REPLACE FUNCTION public.expire_missed_goals()
RETURNS void AS $$
DECLARE
  expired_goal RECORD;
BEGIN
  -- Find all active goals past their deadline
  FOR expired_goal IN
    SELECT g.id, g.user_id, g.pledge_amount
    FROM public.goals g
    WHERE g.status IN ('active', 'in_quiz')
      AND g.deadline < NOW()
  LOOP
    -- 1. Mark goal as expired
    UPDATE public.goals
    SET status = 'expired', resolved_at = NOW()
    WHERE id = expired_goal.id;

    -- 2. Remove pledged balance (platform keeps it)
    UPDATE public.users
    SET 
      pledged_balance = pledged_balance - expired_goal.pledge_amount,
      streak = 0,
      consecutive_fails = consecutive_fails + 1
    WHERE id = expired_goal.user_id;

    -- 3. Log the forfeiture
    INSERT INTO public.wallet_transactions (user_id, type, amount, balance_after, notes)
    SELECT 
      expired_goal.user_id,
      'forfeit',
      expired_goal.pledge_amount,
      u.available_balance,
      'Deadline missed: goal expired'
    FROM public.users u
    WHERE u.id = expired_goal.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To run this automatically, enable pg_cron in Supabase and add:
-- SELECT cron.schedule('expire-goals', '*/5 * * * *', 'SELECT public.expire_missed_goals()');
