-- Allow any doctor to view all appointments (not just their assigned ones)
CREATE POLICY "Doctors can view all appointments"
ON public.appointments
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Allow any doctor to update any appointment (approve/deny/complete)
CREATE POLICY "Doctors can update any appointment"
ON public.appointments
FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Drop the restrictive old policies
DROP POLICY IF EXISTS "Doctors can view their assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update assigned appointments" ON public.appointments;