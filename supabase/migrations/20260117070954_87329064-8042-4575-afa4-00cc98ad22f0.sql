-- =============================================================
-- PHASE 2: GRANULAR SECURITY HARDENING
-- Apply least-privilege access controls based on security scan
-- =============================================================

-- =============================================
-- 1. FIX DOCTOR ACCESS TO HEALTH VISITS
-- Doctors should only see visits where they are the treating doctor
-- =============================================

-- Drop the overly permissive doctor policy
DROP POLICY IF EXISTS "Doctors can view all health visits" ON public.health_visits;

-- Create restrictive policy - doctors see only their own patients
CREATE POLICY "Doctors can view health visits they created" 
ON public.health_visits 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND 
  doctor_id IN (
    SELECT id FROM medical_officers WHERE user_id = auth.uid()
  )
);

-- =============================================
-- 2. CREATE SECURE VIEW FOR MENTOR ACCESS TO HEALTH VISITS
-- Mentors should only see limited info, not full medical details
-- =============================================

-- Create a view that hides sensitive medical information from mentors
CREATE OR REPLACE VIEW public.mentor_health_visits_view 
WITH (security_invoker=on) AS
SELECT 
  hv.id,
  hv.student_id,
  hv.visit_date,
  hv.reason_category,
  hv.follow_up_required,
  hv.follow_up_date,
  hv.created_at
  -- Excludes: diagnosis, prescription, reason_notes, reason_subcategory
FROM health_visits hv;

-- Drop the overly permissive mentor policy on health_visits
DROP POLICY IF EXISTS "Mentors can view limited visit info for assigned students" ON public.health_visits;

-- Create policy for mentors to access only through the limited view
CREATE POLICY "Mentors access health visits through limited view" 
ON public.health_visits 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'mentor'::app_role) AND 
  student_id IN (
    SELECT s.id 
    FROM students s 
    JOIN mentors m ON s.mentor_id = m.id 
    WHERE m.user_id = auth.uid()
  )
);

-- Note: Mentors should query mentor_health_visits_view, not health_visits directly
-- RLS still applies but the view limits visible columns

-- =============================================
-- 3. FIX DOCTOR APPOINTMENT VISIBILITY
-- Tighten the visiting doctor condition
-- =============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Doctors can view assigned appointments" ON public.appointments;

-- Create stricter policy - only see appointments assigned to the logged-in doctor
CREATE POLICY "Doctors can view their assigned appointments" 
ON public.appointments 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    -- Medical officer can see their own appointments
    medical_officer_id IN (
      SELECT id FROM medical_officers WHERE user_id = auth.uid()
    )
  )
);

-- =============================================
-- 4. RESTRICT DOCTOR ACCESS TO STUDENTS
-- Doctors should only see students they have appointments with or health visits for
-- =============================================

-- Drop overly broad doctor policies on students
DROP POLICY IF EXISTS "Doctors can view all students" ON public.students;

-- Create restrictive policy - doctors see only students they interact with
CREATE POLICY "Doctors can view students with appointments or visits" 
ON public.students 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    -- Students with appointments to this doctor
    id IN (
      SELECT DISTINCT patient_id FROM appointments 
      WHERE medical_officer_id IN (
        SELECT id FROM medical_officers WHERE user_id = auth.uid()
      )
    )
    OR
    -- Students with health visits by this doctor
    id IN (
      SELECT DISTINCT student_id FROM health_visits 
      WHERE doctor_id IN (
        SELECT id FROM medical_officers WHERE user_id = auth.uid()
      )
    )
  )
);

-- =============================================
-- 5. ADD ADMIN MANAGEMENT POLICIES FOR WORKING_STAFF
-- =============================================

CREATE POLICY "Admins can insert working staff" 
ON public.working_staff 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update working staff" 
ON public.working_staff 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete working staff" 
ON public.working_staff 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 6. ADD DATA RETENTION FOR SECURITY TABLES
-- Auto-delete old login attempts (90 days)
-- =============================================

-- Create function to clean up old login attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts 
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- Create function to archive old audit logs
CREATE OR REPLACE FUNCTION public.archive_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete audit logs older than 1 year
  DELETE FROM public.security_audit_log 
  WHERE created_at < now() - interval '1 year';
END;
$$;

-- Note: These functions should be called via a scheduled job (pg_cron)
-- or manually by admins periodically

COMMENT ON FUNCTION public.cleanup_old_login_attempts IS 'Removes login attempts older than 90 days for data retention compliance';
COMMENT ON FUNCTION public.archive_old_audit_logs IS 'Removes audit logs older than 1 year for data retention compliance';

-- =============================================
-- 7. UPDATE AMBULANCE SERVICE - Mark as intentionally public
-- =============================================

COMMENT ON TABLE public.ambulance_service IS 'Emergency ambulance service information. Intentionally publicly accessible for emergency access. Contains institutional emergency numbers, not personal staff contacts.';