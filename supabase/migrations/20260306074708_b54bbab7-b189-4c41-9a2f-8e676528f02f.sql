CREATE POLICY "Pharmacy can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'pharmacy'::app_role));