
-- Drop the restrictive doctor SELECT policy
DROP POLICY IF EXISTS "Doctors can view their referrals" ON public.medical_leave_requests;

-- Create a new policy allowing doctors to view ALL medical leave requests
CREATE POLICY "Doctors can view all medical leave requests"
ON public.medical_leave_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));
