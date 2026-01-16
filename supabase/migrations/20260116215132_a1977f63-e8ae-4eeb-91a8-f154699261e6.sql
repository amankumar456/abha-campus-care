-- Further restrict the SELECT policies to require authentication check
-- This explicitly includes auth.uid() IS NOT NULL in the USING clause

-- Drop and recreate the policies with explicit authentication check
DROP POLICY IF EXISTS "Authenticated users can view working staff" ON public.working_staff;

CREATE POLICY "Authenticated users can view working staff" 
ON public.working_staff 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);