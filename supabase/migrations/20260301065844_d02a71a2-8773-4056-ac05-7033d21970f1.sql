
-- Create pharmacy_dispensing table
CREATE TABLE public.pharmacy_dispensing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  dispensed_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  notes TEXT,
  dispensed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_dispensing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacy can view all dispensing" ON public.pharmacy_dispensing
  FOR SELECT USING (has_role(auth.uid(), 'pharmacy') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Pharmacy can insert dispensing" ON public.pharmacy_dispensing
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'pharmacy'));

CREATE POLICY "Pharmacy can update dispensing" ON public.pharmacy_dispensing
  FOR UPDATE USING (has_role(auth.uid(), 'pharmacy'));

-- Create lab_reports table
CREATE TABLE public.lab_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID REFERENCES public.prescriptions(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  doctor_id UUID REFERENCES public.medical_officers(id),
  test_name TEXT NOT NULL,
  report_file_url TEXT,
  report_file_name TEXT,
  uploaded_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab officers can view all reports" ON public.lab_reports
  FOR SELECT USING (has_role(auth.uid(), 'lab_officer') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'doctor'));

CREATE POLICY "Lab officers can insert reports" ON public.lab_reports
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'lab_officer'));

CREATE POLICY "Lab officers can update reports" ON public.lab_reports
  FOR UPDATE USING (has_role(auth.uid(), 'lab_officer'));

CREATE POLICY "Students can view own lab reports" ON public.lab_reports
  FOR SELECT USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

-- Create storage bucket for lab reports
INSERT INTO storage.buckets (id, name, public) VALUES ('lab-reports', 'lab-reports', false);

CREATE POLICY "Lab officers can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lab-reports' AND has_role(auth.uid(), 'lab_officer'));

CREATE POLICY "Authenticated users can view lab reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL);
