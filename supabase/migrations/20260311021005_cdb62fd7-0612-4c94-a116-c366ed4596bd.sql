-- Fix students RESTRICTIVE SELECT policies that block lab_officer/pharmacy/medical_staff
-- Convert the problematic restrictive policies to permissive ones

-- Drop restrictive SELECT policies
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Doctors can view all students" ON public.students;
DROP POLICY IF EXISTS "Mentors can view students who listed them" ON public.students;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can view all students"
ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can view all students"
ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Mentors can view students who listed them"
ON public.students FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'mentor'::app_role) AND (
  mentor_id IN (SELECT mentors.id FROM mentors WHERE mentors.user_id = auth.uid())
  OR lower(mentor_name) = lower((SELECT mentors.name FROM mentors WHERE mentors.user_id = auth.uid() LIMIT 1))
));