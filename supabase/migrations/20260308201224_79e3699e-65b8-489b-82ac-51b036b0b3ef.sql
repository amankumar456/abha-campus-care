
CREATE TABLE public.empanelled_hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number integer NOT NULL,
  name text NOT NULL,
  location text NOT NULL,
  entitlement text NOT NULL DEFAULT 'Employees & Students',
  empanelment_period text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.empanelled_hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view empanelled hospitals" ON public.empanelled_hospitals
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage empanelled hospitals" ON public.empanelled_hospitals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
