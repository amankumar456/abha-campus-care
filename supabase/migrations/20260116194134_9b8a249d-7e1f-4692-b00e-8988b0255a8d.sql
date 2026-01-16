
-- Create RLS policy for admins to view all user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policy for admins to insert user roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create RLS policy for admins to delete user roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all students
CREATE POLICY "Admins can view all students"
ON public.students FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage students
CREATE POLICY "Admins can insert students"
ON public.students FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update students"
ON public.students FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete students"
ON public.students FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage mentors
CREATE POLICY "Admins can insert mentors"
ON public.mentors FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mentors"
ON public.mentors FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mentors"
ON public.mentors FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all health visits
CREATE POLICY "Admins can view all health visits"
ON public.health_visits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
