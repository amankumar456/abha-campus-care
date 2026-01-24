-- Add health priority to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS health_priority TEXT CHECK (health_priority IN ('low', 'medium', 'high')) DEFAULT 'medium';

-- Add rest days field to medical_leave_requests for doctor to specify
ALTER TABLE public.medical_leave_requests 
ADD COLUMN IF NOT EXISTS rest_days INTEGER,
ADD COLUMN IF NOT EXISTS academic_leave_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by_doctor_id UUID REFERENCES public.medical_officers(id),
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster appointment queries by doctor
CREATE INDEX IF NOT EXISTS idx_appointments_medical_officer_id ON public.appointments(medical_officer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);

-- Update RLS policy to allow doctors to update health priority
DROP POLICY IF EXISTS "Doctors can update assigned appointments" ON public.appointments;

CREATE POLICY "Doctors can update assigned appointments" 
ON public.appointments 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    medical_officer_id IN (
      SELECT id FROM medical_officers WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  has_role(auth.uid(), 'doctor'::app_role) AND (
    medical_officer_id IN (
      SELECT id FROM medical_officers WHERE user_id = auth.uid()
    )
  )
);