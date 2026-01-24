-- Ensure the conflicting doctor policies are removed
-- Drop both overlapping policies that cause recursion
DROP POLICY IF EXISTS "Doctors can search students for referrals" ON public.students;
DROP POLICY IF EXISTS "Doctors can view students via limited view" ON public.students;
DROP POLICY IF EXISTS "Doctors can view all students" ON public.students;

-- Create a single clean policy for doctors
CREATE POLICY "Doctors can view all students"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));