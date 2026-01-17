-- =============================================================
-- STUDENT ACCESS CONTROL & REGISTRATION ENHANCEMENT
-- =============================================================

-- =============================================
-- 1. ADD MENTOR NAME/CONTACT FIELDS TO STUDENTS TABLE
-- For matching mentors by name entered during registration
-- =============================================

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS mentor_name text,
ADD COLUMN IF NOT EXISTS mentor_contact text,
ADD COLUMN IF NOT EXISTS mentor_email text,
ADD COLUMN IF NOT EXISTS branch text,
ADD COLUMN IF NOT EXISTS year_of_study text;

-- =============================================
-- 2. UPDATE MENTOR ACCESS POLICY
-- Mentors can only see students who mentioned their name
-- =============================================

-- Drop old mentor policy
DROP POLICY IF EXISTS "Mentors can view assigned students" ON public.students;

-- Create new policy - mentors see students who mentioned their name
CREATE POLICY "Mentors can view students who listed them" 
ON public.students 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'mentor'::app_role) AND (
    -- Match by mentor_id (existing link)
    mentor_id IN (
      SELECT id FROM mentors WHERE user_id = auth.uid()
    )
    OR
    -- Match by mentor name entered by student (case-insensitive)
    lower(mentor_name) = lower((
      SELECT name FROM mentors WHERE user_id = auth.uid() LIMIT 1
    ))
  )
);

-- =============================================
-- 3. ENSURE DOCTORS CAN SEE ALL STUDENTS
-- Medical officers need full access for patient care
-- =============================================

-- Drop restrictive doctor policy
DROP POLICY IF EXISTS "Doctors can view students with appointments or visits" ON public.students;

-- Create policy - doctors see ALL students for medical care
CREATE POLICY "Doctors can view all students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));

-- =============================================
-- 4. ALLOW STUDENTS TO INSERT THEIR OWN PROFILE
-- Required for registration flow
-- =============================================

CREATE POLICY "Students can insert own profile" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. UPDATE HEALTH VISITS POLICY
-- Ensure students can only see their own medical records
-- =============================================

-- Verify student policy exists (already added in previous migration)
-- Students can view own health visits - already exists

-- =============================================
-- 6. UPDATE APPOINTMENTS POLICY
-- Students can only see their own appointments
-- =============================================

-- Policy already exists: "Users can view own appointments" 
-- with condition (auth.uid() = patient_id)

-- =============================================
-- 7. ADD COMMENTS FOR CLARITY
-- =============================================

COMMENT ON COLUMN public.students.mentor_name IS 'Name of mentor entered by student during registration - used for mentor matching';
COMMENT ON COLUMN public.students.mentor_contact IS 'Mentor phone number entered by student during registration';
COMMENT ON COLUMN public.students.mentor_email IS 'Mentor email entered by student during registration';
COMMENT ON COLUMN public.students.branch IS 'Academic branch/department of the student';
COMMENT ON COLUMN public.students.year_of_study IS 'Current year of study (1st, 2nd, 3rd, 4th, 5th)';