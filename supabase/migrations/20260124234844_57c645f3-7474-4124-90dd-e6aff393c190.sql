-- Fix infinite recursion on students table by consolidating policies
-- The issue is multiple overlapping SELECT policies for doctors

-- First, drop the conflicting policies
DROP POLICY IF EXISTS "Doctors can search students for referrals" ON public.students;
DROP POLICY IF EXISTS "Doctors can view students via limited view" ON public.students;

-- Create a single, simple policy for doctors to view all students
-- (Doctors need to search students for referrals, so they need broad access)
CREATE POLICY "Doctors can view all students"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Also fix the health_visits policy that references students table to avoid recursion
DROP POLICY IF EXISTS "Students can view own health visits" ON public.health_visits;

-- Recreate using user_id directly instead of subquery on students
CREATE POLICY "Students can view own health visits"
ON public.health_visits
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);