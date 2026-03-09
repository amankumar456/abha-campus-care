-- Drop all existing restrictive policies on user_roles
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own initial role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Recreate as PERMISSIVE policies (any ONE matching = allowed)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own initial role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));