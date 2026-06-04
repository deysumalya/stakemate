-- Allow users to insert their own profile information
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK ( id = auth.uid() );
