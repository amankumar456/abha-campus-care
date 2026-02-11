
-- Create prescriptions table to store medicine details for appointments
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.medical_officers(id),
  student_id UUID NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription_items table for individual medicines
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  meal_timing TEXT DEFAULT 'after_meal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescriptions
CREATE POLICY "Doctors can create prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can view prescriptions"
  ON public.prescriptions FOR SELECT
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can update prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Students can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (student_id IN (
    SELECT s.user_id FROM students s WHERE s.user_id = auth.uid()
  ));

-- RLS Policies for prescription_items
CREATE POLICY "Doctors can create prescription items"
  ON public.prescription_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can view prescription items"
  ON public.prescription_items FOR SELECT
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own prescription items"
  ON public.prescription_items FOR SELECT
  USING (prescription_id IN (
    SELECT p.id FROM prescriptions p WHERE p.student_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
