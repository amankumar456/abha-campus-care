
-- Fix prescriptions SELECT policy for students (currently broken - compares student_id with user_id)
DROP POLICY IF EXISTS "Students can view own prescriptions" ON public.prescriptions;
CREATE POLICY "Students can view own prescriptions"
ON public.prescriptions FOR SELECT
USING (student_id IN (
  SELECT s.id FROM students s WHERE s.user_id = auth.uid()
));

-- Fix prescription_items SELECT policy for students too
DROP POLICY IF EXISTS "Students can view own prescription items" ON public.prescription_items;
CREATE POLICY "Students can view own prescription items"
ON public.prescription_items FOR SELECT
USING (prescription_id IN (
  SELECT p.id FROM prescriptions p
  JOIN students s ON p.student_id = s.id
  WHERE s.user_id = auth.uid()
));
