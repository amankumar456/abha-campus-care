
-- Drop the restrictive doctor UPDATE policy
DROP POLICY IF EXISTS "Doctors can update their referrals" ON public.medical_leave_requests;

-- Create a new policy allowing doctors to update ALL medical leave requests
CREATE POLICY "Doctors can update all medical leave requests"
ON public.medical_leave_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));
