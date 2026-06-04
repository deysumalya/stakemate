-- Allow users to read their own profile information
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING ( id = auth.uid() );
