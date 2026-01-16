
-- Create function to update timestamps FIRST
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create enum for appointment status
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Medical Officers table
CREATE TABLE public.medical_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  qualification TEXT NOT NULL,
  phone_office TEXT,
  phone_mobile TEXT[],
  email TEXT,
  photo_url TEXT,
  is_senior BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Visiting Doctors table with schedule
CREATE TABLE public.visiting_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  visit_day TEXT NOT NULL,
  visit_time_start TIME NOT NULL,
  visit_time_end TIME NOT NULL,
  is_monthly BOOLEAN DEFAULT false,
  month_week INTEGER,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Working Staff table
CREATE TABLE public.working_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Medical Management Team
CREATE TABLE public.management_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_type TEXT NOT NULL CHECK (doctor_type IN ('medical_officer', 'visiting_doctor')),
  medical_officer_id UUID REFERENCES public.medical_officers(id) ON DELETE SET NULL,
  visiting_doctor_id UUID REFERENCES public.visiting_doctors(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status DEFAULT 'pending',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_doctor_reference CHECK (
    (doctor_type = 'medical_officer' AND medical_officer_id IS NOT NULL) OR
    (doctor_type = 'visiting_doctor' AND visiting_doctor_id IS NOT NULL)
  )
);

-- Ambulance Service Info
CREATE TABLE public.ambulance_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_landline TEXT NOT NULL,
  phone_mobile TEXT NOT NULL,
  description TEXT,
  equipment TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visiting_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_service ENABLE ROW LEVEL SECURITY;

-- Public read access for staff info
CREATE POLICY "Anyone can view medical officers" ON public.medical_officers FOR SELECT USING (true);
CREATE POLICY "Anyone can view visiting doctors" ON public.visiting_doctors FOR SELECT USING (true);
CREATE POLICY "Anyone can view working staff" ON public.working_staff FOR SELECT USING (true);
CREATE POLICY "Anyone can view management team" ON public.management_team FOR SELECT USING (true);
CREATE POLICY "Anyone can view ambulance service" ON public.ambulance_service FOR SELECT USING (true);

-- Appointment policies
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id);

-- Triggers for updated_at
CREATE TRIGGER update_medical_officers_updated_at BEFORE UPDATE ON public.medical_officers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visiting_doctors_updated_at BEFORE UPDATE ON public.visiting_doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Medical Officers
INSERT INTO public.medical_officers (name, designation, qualification, phone_office, phone_mobile, email, is_senior) VALUES
('Dr. Radha Rukmini Ganneni', 'Senior Medical Officer', 'M.B.B.S, Diploma in Anaesthesiology', '0870-2452091', ARRAY['9490165359', '9866994444'], 'radharukmini@nitw.ac.in', true),
('Dr. Chintala Karthik', 'Medical Officer', 'M.B.B.S (SVS Medical college Mahabubnagar), 2015', '0870-2452090', ARRAY['8332969468', '9676075075'], 'karthik@nitw.ac.in', false),
('Dr. Pradeep Dodda', 'Medical Officer', 'M.B.B.S (Guntur Medical College Guntur), 2013', '0870-2452096', ARRAY['8332969354', '9550680609'], 'pradeep@nitw.ac.in', false),
('Dr. Anchoori Karthik', 'Medical Officer', 'M.B.B.S (Chalmeda Anand Rao Institute of Medical Sciences Karimnagar), 2018', '0870-2452098', ARRAY['8332969392', '8886004167'], 'karuanchoori@nitw.ac.in', false);

-- Insert Visiting Doctors
INSERT INTO public.visiting_doctors (name, specialization, visit_day, visit_time_start, visit_time_end, is_monthly, month_week) VALUES
('Dr. B. Jagadeesh Babu', 'Psychiatrist', 'Wednesday', '17:00', '18:00', false, NULL),
('Dr. B. Sandhya Rani', 'Gynaecologist', 'Tuesday', '16:00', '17:00', false, NULL),
('Dr. Sudhakar Reddy', 'Cardiologist', 'Thursday', '10:00', '15:00', true, 1),
('Dr. G. Vidya Reddy', 'Dermatologist', 'Friday', '16:00', '17:30', false, NULL),
('Dr. J. Sowmya', 'Pulmonologist (Chest Physician)', 'Monday', '16:00', '18:00', false, NULL),
('Dr. J. Sowmya', 'Pulmonologist (Chest Physician)', 'Thursday', '16:00', '18:00', false, NULL),
('Dr. P. Prathik', 'Dental Doctor', 'Thursday', '15:00', '17:00', false, NULL),
('Dr. P. Sumanth', 'Paediatrician', 'Wednesday', '10:00', '12:00', true, 1);

-- Insert Working Staff
INSERT INTO public.working_staff (name, designation, phone, email) VALUES
('K. Rameeja Bee', 'Technical Assistant (Staff Nurse)', '8332969240', 'rameejabee@nitw.ac.in'),
('Y. Bikshapathy', 'Junior Assistant (UG)', '8332969306', 'bixapathi@nitw.ac.in'),
('Md. Inqushaf Ali', 'Junior Assistant', '8332969543', 'inqushafali@nitw.ac.in'),
('Rajanna M', 'Senior Assistant', '8332969552', 'mraju0353@nitw.ac.in');

-- Insert Management Team
INSERT INTO public.management_team (name, position, display_order) VALUES
('Prof. N. Narsaiah', 'Chairperson', 1),
('Shri. G. Ramesh', 'Member', 2),
('Dr. G. Radha Rukmini', 'Member and Convener', 3),
('Prof. P. Hari Prasad Reddy', 'Member', 4),
('Ms. Billu Shilpa', 'Member', 5);

-- Insert Ambulance Service Info
INSERT INTO public.ambulance_service (phone_landline, phone_mobile, description, equipment) VALUES
('0870-2462099', '9491065006', 'Ambulance service is provided 24X7. Emergency phone number is displayed in all buildings and hostels.', ARRAY['Oxygen Cylinder', 'Nebulizer', 'First Aid Box', 'Routine Medicines', 'Essential Life Saving Drugs']);
