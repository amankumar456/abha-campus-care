
-- Emergency Treatments table for tracking treatment records
CREATE TABLE public.emergency_treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_request_id UUID REFERENCES public.ambulance_requests(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.medical_officers(id),
  treatment_type TEXT NOT NULL,
  medication_given TEXT,
  procedure_performed TEXT,
  vitals_recorded JSONB,
  notes TEXT,
  outcome TEXT,
  requires_followup BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emergency Handover notes for shift changes
CREATE TABLE public.emergency_handovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_request_id UUID REFERENCES public.ambulance_requests(id) ON DELETE CASCADE,
  handover_from_doctor_id UUID REFERENCES public.medical_officers(id),
  handover_to_doctor_id UUID REFERENCES public.medical_officers(id),
  current_status TEXT NOT NULL,
  pending_actions TEXT[] DEFAULT '{}',
  follow_up_instructions TEXT,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emergency_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_handovers ENABLE ROW LEVEL SECURITY;

-- RLS policies for emergency_treatments
CREATE POLICY "Doctors can manage emergency treatments"
ON public.emergency_treatments
FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for emergency_handovers
CREATE POLICY "Doctors can manage emergency handovers"
ON public.emergency_handovers
FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
