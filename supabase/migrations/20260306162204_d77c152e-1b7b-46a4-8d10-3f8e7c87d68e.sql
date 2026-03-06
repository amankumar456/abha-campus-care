
-- Create pharmacy inventory table for medicine stock management
CREATE TABLE public.pharmacy_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT DEFAULT 'General',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'tablets',
  reorder_level INTEGER DEFAULT 10,
  expiry_date DATE,
  batch_number TEXT,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;

-- Pharmacy staff can do everything
CREATE POLICY "Pharmacy can manage inventory"
ON public.pharmacy_inventory
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'pharmacy'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Doctors can view inventory (to know what's available)
CREATE POLICY "Doctors can view inventory"
ON public.pharmacy_inventory
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'doctor'::app_role));
