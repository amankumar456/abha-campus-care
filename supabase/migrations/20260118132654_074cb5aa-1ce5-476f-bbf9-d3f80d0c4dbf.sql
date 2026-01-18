-- Create a view for doctors that excludes sensitive contact information
CREATE VIEW public.students_doctor_view
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    roll_number,
    full_name,
    program,
    batch,
    branch,
    year_of_study,
    mentor_id,
    created_at,
    updated_at
    -- Excludes: email, phone, mentor_name, mentor_contact, mentor_email
  FROM public.students;

-- Add comment explaining the view purpose
COMMENT ON VIEW public.students_doctor_view IS 'Limited student view for doctors - excludes contact information for privacy';

-- Drop the existing permissive doctor policy on students table
DROP POLICY IF EXISTS "Doctors can view all students" ON public.students;

-- Create a restrictive policy that only allows doctors to access via the view
-- Doctors should query students_doctor_view instead of students directly
CREATE POLICY "Doctors can view students via limited view"
  ON public.students
  FOR SELECT
  USING (
    has_role(auth.uid(), 'doctor') AND 
    id IN (
      SELECT student_id FROM public.health_visits 
      WHERE doctor_id IN (SELECT id FROM public.medical_officers WHERE user_id = auth.uid())
    )
  );