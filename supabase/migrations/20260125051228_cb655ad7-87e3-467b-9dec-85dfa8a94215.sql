-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Create a proper insert policy that allows doctors/admins to create notifications
CREATE POLICY "Doctors and admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);