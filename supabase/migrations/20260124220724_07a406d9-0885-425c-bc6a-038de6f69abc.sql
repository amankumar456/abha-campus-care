
-- Add policy to allow doctors to search any student for medical leave referrals
CREATE POLICY "Doctors can search students for referrals"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));
