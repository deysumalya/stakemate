-- Migration: Create MATRIX Requests table for human-in-the-loop AI simulation
CREATE TABLE IF NOT EXISTS public.matrix_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  response_json JSONB,
  status TEXT DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.matrix_requests ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (or admins) to view and manage
-- For MVP, we'll allow authenticated users to view their own requests, 
-- but since this is an admin tool, we'll just open it to authenticated for testing
CREATE POLICY "Users can insert matrix requests" ON public.matrix_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own matrix requests" ON public.matrix_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- For the admin dashboard, we need to allow viewing all pending requests
-- For MVP, we'll allow any authenticated user to view/update any matrix request
CREATE POLICY "Admins can view all matrix requests" ON public.matrix_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update all matrix requests" ON public.matrix_requests
  FOR UPDATE TO authenticated USING (true);
