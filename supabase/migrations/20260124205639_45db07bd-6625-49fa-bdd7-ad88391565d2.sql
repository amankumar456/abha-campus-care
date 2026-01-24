-- Create student_profiles table to store medical and extended information
CREATE TABLE public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Medical Information
  blood_group TEXT,
  has_previous_health_issues BOOLEAN DEFAULT false,
  previous_health_details TEXT,
  current_medications TEXT,
  known_allergies TEXT,
  covid_vaccination_status TEXT,
  has_disability BOOLEAN DEFAULT false,
  disability_details TEXT,
  
  -- Emergency Contacts
  emergency_contact TEXT,
  emergency_relationship TEXT,
  father_name TEXT,
  father_contact TEXT,
  mother_name TEXT,
  mother_contact TEXT,
  
  -- Declarations
  accuracy_confirmation BOOLEAN DEFAULT false,
  code_of_conduct BOOLEAN DEFAULT false,
  photo_video_consent BOOLEAN DEFAULT false,
  medical_authorization BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view own profile"
ON public.student_profiles
FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert own profile"
ON public.student_profiles
FOR INSERT
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own profile"
ON public.student_profiles
FOR UPDATE
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can view student profiles"
ON public.student_profiles
FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Admins can manage all profiles"
ON public.student_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();