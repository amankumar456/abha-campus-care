-- Add RLS policies for admins to manage medical_officers
CREATE POLICY "Admins can insert medical officers" 
ON public.medical_officers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update medical officers" 
ON public.medical_officers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete medical officers" 
ON public.medical_officers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policies for admins to manage visiting_doctors
CREATE POLICY "Admins can insert visiting doctors" 
ON public.visiting_doctors 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update visiting doctors" 
ON public.visiting_doctors 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete visiting doctors" 
ON public.visiting_doctors 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));