-- Allow users to update their own profile information
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING ( id = auth.uid() ) 
WITH CHECK ( id = auth.uid() );
