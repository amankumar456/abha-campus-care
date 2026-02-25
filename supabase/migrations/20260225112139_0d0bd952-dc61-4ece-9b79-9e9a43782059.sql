
CREATE POLICY "Doctors can update own profile"
ON public.medical_officers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
