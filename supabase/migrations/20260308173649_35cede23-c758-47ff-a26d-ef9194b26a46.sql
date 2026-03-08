
CREATE POLICY "Doctors can insert own profile"
ON public.medical_officers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'doctor'::app_role));
