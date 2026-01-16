-- Fix overly permissive INSERT policies for audit tables
-- These policies should only allow insertions via service role or specific conditions

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;

-- Create more restrictive policies
-- Audit logs can only be inserted by authenticated users (their own actions are logged)
CREATE POLICY "Authenticated users can log security events" 
ON public.security_audit_log 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Login attempts tracking - allow from anon role but only for logging purposes
-- The insert is controlled by the application layer
CREATE POLICY "Allow tracking login attempts" 
ON public.login_attempts 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Only allow inserts with a valid email format and recent timestamp
  email IS NOT NULL AND 
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  created_at >= now() - interval '1 minute'
);