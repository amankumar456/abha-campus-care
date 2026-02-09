
-- Add health centre visit and doctor clearance fields to medical_leave_requests
ALTER TABLE public.medical_leave_requests 
ADD COLUMN IF NOT EXISTS health_centre_visited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS doctor_clearance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS doctor_clearance_date timestamptz,
ADD COLUMN IF NOT EXISTS cleared_by_doctor_id uuid REFERENCES public.medical_officers(id);
