-- Fix lab_reports RLS: convert RESTRICTIVE to PERMISSIVE

-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Doctors can insert lab reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Lab officers can insert reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Lab officers can update reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Lab officers can view all reports" ON public.lab_reports;
DROP POLICY IF EXISTS "Students can view own lab reports" ON public.lab_reports;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Doctors can insert lab reports"
ON public.lab_reports FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Lab officers can insert reports"
ON public.lab_reports FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'lab_officer'::app_role));

CREATE POLICY "Lab officers can update reports"
ON public.lab_reports FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'lab_officer'::app_role));

CREATE POLICY "Lab officers can view all reports"
ON public.lab_reports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'lab_officer'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Students can view own lab reports"
ON public.lab_reports FOR SELECT
TO authenticated
USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));