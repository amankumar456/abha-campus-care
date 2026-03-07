
-- Allow doctors to insert lab reports (for prescribing lab tests)
CREATE POLICY "Doctors can insert lab reports"
  ON public.lab_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

-- Allow lab officers to insert notifications (for notifying students)
CREATE POLICY "Lab officers can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'lab_officer'::app_role));
