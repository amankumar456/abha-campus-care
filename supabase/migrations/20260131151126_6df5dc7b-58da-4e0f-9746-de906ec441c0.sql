-- Allow users to insert their own initial role
CREATE POLICY "Users can insert own initial role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);