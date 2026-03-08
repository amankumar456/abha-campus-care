
-- Allow medical staff to view all appointments
CREATE POLICY "Medical staff can view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'medical_staff'::app_role));

-- Enable realtime for medical_leave_requests and appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
