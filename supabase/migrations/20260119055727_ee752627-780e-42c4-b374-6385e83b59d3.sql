-- Create enum for medical leave status
CREATE TYPE public.medical_leave_status AS ENUM (
  'doctor_referred',
  'student_form_pending',
  'on_leave',
  'return_pending',
  'returned',
  'cancelled'
);

-- Create medical_leave_requests table
CREATE TABLE public.medical_leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Doctor referral fields
  referring_doctor_id UUID REFERENCES public.medical_officers(id),
  referral_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  referral_hospital TEXT NOT NULL,
  expected_duration TEXT NOT NULL,
  doctor_notes TEXT,
  
  -- Student form fields (Part A & B)
  illness_description TEXT,
  leave_start_date DATE,
  expected_return_date DATE,
  accompanist_type TEXT,
  accompanist_name TEXT,
  accompanist_contact TEXT,
  accompanist_relationship TEXT,
  student_form_submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Return notification fields (Part C)
  actual_return_date TIMESTAMP WITH TIME ZONE,
  hospital_discharge_date DATE,
  follow_up_notes TEXT,
  return_submitted_at TIMESTAMP WITH TIME ZONE,
  
  -- Status and tracking
  status medical_leave_status NOT NULL DEFAULT 'doctor_referred',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_leave_requests ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_medical_leave_student ON public.medical_leave_requests(student_id);
CREATE INDEX idx_medical_leave_status ON public.medical_leave_requests(status);
CREATE INDEX idx_medical_leave_doctor ON public.medical_leave_requests(referring_doctor_id);

-- RLS Policies

-- Admins can do everything
CREATE POLICY "Admins can manage all medical leave requests"
ON public.medical_leave_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Doctors can create and view their referrals
CREATE POLICY "Doctors can create medical leave referrals"
ON public.medical_leave_requests
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor') AND
  referring_doctor_id IN (
    SELECT id FROM public.medical_officers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view their referrals"
ON public.medical_leave_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor') AND
  referring_doctor_id IN (
    SELECT id FROM public.medical_officers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Doctors can update their referrals"
ON public.medical_leave_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'doctor') AND
  referring_doctor_id IN (
    SELECT id FROM public.medical_officers WHERE user_id = auth.uid()
  )
);

-- Students can view and update their own leave requests
CREATE POLICY "Students can view own leave requests"
ON public.medical_leave_requests
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Students can update own leave requests"
ON public.medical_leave_requests
FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Mentors can view leave requests for their mentees
CREATE POLICY "Mentors can view mentee leave requests"
ON public.medical_leave_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'mentor') AND
  student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.mentors m ON s.mentor_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_medical_leave_requests_updated_at
BEFORE UPDATE ON public.medical_leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();