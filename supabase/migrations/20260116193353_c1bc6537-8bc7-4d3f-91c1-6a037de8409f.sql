
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('doctor', 'mentor', 'student');

-- Create enum for visit reasons
CREATE TYPE public.visit_reason AS ENUM ('medical_illness', 'injury', 'mental_wellness', 'vaccination', 'routine_checkup', 'other');

-- Create user_roles table for RBAC
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create mentors table
CREATE TABLE public.mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    roll_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    program TEXT NOT NULL,
    batch TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mentor_id UUID REFERENCES public.mentors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create health_visits table
CREATE TABLE public.health_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.medical_officers(id) ON DELETE SET NULL,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reason_category visit_reason NOT NULL,
    reason_subcategory TEXT,
    reason_notes TEXT,
    diagnosis TEXT,
    prescription TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_visits ENABLE ROW LEVEL SECURITY;

-- Add user_id to medical_officers for linking to auth
ALTER TABLE public.medical_officers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for mentors
CREATE POLICY "Anyone can view mentors"
ON public.mentors FOR SELECT
USING (true);

CREATE POLICY "Mentors can update own profile"
ON public.mentors FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for students
CREATE POLICY "Doctors can view all students"
ON public.students FOR SELECT
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Mentors can view assigned students"
ON public.students FOR SELECT
USING (
    public.has_role(auth.uid(), 'mentor') AND
    mentor_id IN (SELECT id FROM public.mentors WHERE user_id = auth.uid())
);

CREATE POLICY "Students can view own profile"
ON public.students FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert students"
ON public.students FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update students"
ON public.students FOR UPDATE
USING (public.has_role(auth.uid(), 'doctor'));

-- RLS Policies for health_visits
CREATE POLICY "Doctors can view all health visits"
ON public.health_visits FOR SELECT
USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Mentors can view limited visit info for assigned students"
ON public.health_visits FOR SELECT
USING (
    public.has_role(auth.uid(), 'mentor') AND
    student_id IN (
        SELECT s.id FROM public.students s
        JOIN public.mentors m ON s.mentor_id = m.id
        WHERE m.user_id = auth.uid()
    )
);

CREATE POLICY "Doctors can create health visits"
ON public.health_visits FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update health visits"
ON public.health_visits FOR UPDATE
USING (public.has_role(auth.uid(), 'doctor'));

-- Triggers for updated_at
CREATE TRIGGER update_mentors_updated_at
BEFORE UPDATE ON public.mentors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_visits_updated_at
BEFORE UPDATE ON public.health_visits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed some sample data
INSERT INTO public.mentors (name, department, email, phone) VALUES
('Dr. Rajesh Kumar', 'Computer Science', 'rajesh.kumar@university.edu', '+91 9876543210'),
('Dr. Priya Sharma', 'Electronics', 'priya.sharma@university.edu', '+91 9876543211'),
('Dr. Amit Patel', 'Mechanical', 'amit.patel@university.edu', '+91 9876543212');

INSERT INTO public.students (roll_number, full_name, program, batch, email, phone, mentor_id) VALUES
('UE20CS001', 'Arun Mehta', 'B.Tech Computer Science', '2020', 'arun.mehta@student.edu', '+91 9000000001', (SELECT id FROM public.mentors WHERE name = 'Dr. Rajesh Kumar')),
('UE20CS002', 'Sneha Reddy', 'B.Tech Computer Science', '2020', 'sneha.reddy@student.edu', '+91 9000000002', (SELECT id FROM public.mentors WHERE name = 'Dr. Rajesh Kumar')),
('UE20EC001', 'Vikram Singh', 'B.Tech Electronics', '2020', 'vikram.singh@student.edu', '+91 9000000003', (SELECT id FROM public.mentors WHERE name = 'Dr. Priya Sharma')),
('UE21ME001', 'Kavya Nair', 'B.Tech Mechanical', '2021', 'kavya.nair@student.edu', '+91 9000000004', (SELECT id FROM public.mentors WHERE name = 'Dr. Amit Patel'));

-- Insert sample health visits
INSERT INTO public.health_visits (student_id, doctor_id, visit_date, reason_category, reason_subcategory, reason_notes, diagnosis, prescription, follow_up_required, follow_up_date) VALUES
((SELECT id FROM public.students WHERE roll_number = 'UE20CS001'), (SELECT id FROM public.medical_officers LIMIT 1), '2025-12-01 10:00:00+05:30', 'medical_illness', 'Fever/Cold', 'Mild fever and sore throat', 'Upper Respiratory Infection', 'Paracetamol 500mg TDS, Rest for 2 days', false, NULL),
((SELECT id FROM public.students WHERE roll_number = 'UE20CS001'), (SELECT id FROM public.medical_officers LIMIT 1), '2025-11-15 14:30:00+05:30', 'medical_illness', 'Seasonal Allergies', 'Sneezing and runny nose', 'Allergic Rhinitis', 'Cetirizine 10mg OD', false, NULL),
((SELECT id FROM public.students WHERE roll_number = 'UE20CS001'), (SELECT id FROM public.medical_officers LIMIT 1), '2025-10-20 09:00:00+05:30', 'injury', 'Sports Injury', 'Ankle twist during football', 'Mild Ankle Sprain', 'Crepe bandage, Ice pack, Rest', true, '2025-10-27'),
((SELECT id FROM public.students WHERE roll_number = 'UE20CS002'), (SELECT id FROM public.medical_officers LIMIT 1), '2025-12-10 11:00:00+05:30', 'mental_wellness', 'Anxiety', 'Exam stress and sleep issues', 'Anxiety disorder - mild', 'Counselling recommended, Relaxation techniques', true, '2025-12-17'),
((SELECT id FROM public.students WHERE roll_number = 'UE20EC001'), (SELECT id FROM public.medical_officers LIMIT 1), '2025-11-28 15:00:00+05:30', 'vaccination', 'COVID Booster', 'Booster dose administration', 'Vaccination completed', 'Monitor for 30 mins, Rest', false, NULL);
