-- Create ambulance requests table
CREATE TABLE public.ambulance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  requesting_doctor_id UUID REFERENCES public.medical_officers(id),
  medical_leave_request_id UUID REFERENCES public.medical_leave_requests(id),
  
  -- Priority and urgency
  priority_level TEXT NOT NULL CHECK (priority_level IN ('standard', 'urgent', 'emergency')),
  triage_notes TEXT,
  
  -- Ambulance details
  ambulance_type TEXT NOT NULL CHECK (ambulance_type IN ('bls', 'als', 'critical_care')),
  destination_hospital TEXT NOT NULL,
  pickup_location TEXT NOT NULL DEFAULT 'NIT Warangal Campus',
  
  -- Emergency contacts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  accompanying_person TEXT,
  accompanying_person_type TEXT CHECK (accompanying_person_type IN ('warden', 'friend', 'security', 'parent', 'none')),
  
  -- Paramedic instructions
  paramedic_instructions TEXT,
  special_equipment_needed TEXT[],
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'dispatched', 'arrived', 'in_transit', 'delivered', 'completed', 'cancelled')),
  dispatched_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  hospital_arrival_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- ETA tracking
  estimated_arrival_minutes INTEGER,
  actual_arrival_minutes INTEGER,
  
  -- Hospital handover
  receiving_doctor_name TEXT,
  condition_during_transit TEXT CHECK (condition_during_transit IN ('stable', 'deteriorated', 'improved')),
  handover_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave approval workflow table
CREATE TABLE public.leave_approval_workflow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_leave_request_id UUID NOT NULL REFERENCES public.medical_leave_requests(id) ON DELETE CASCADE,
  
  -- Approval levels
  current_approval_level INTEGER NOT NULL DEFAULT 1,
  required_approval_level INTEGER NOT NULL DEFAULT 1,
  
  -- Level 1: College Doctor
  level1_approved_by UUID REFERENCES public.medical_officers(id),
  level1_approved_at TIMESTAMP WITH TIME ZONE,
  level1_notes TEXT,
  
  -- Level 2: Medical Superintendent
  level2_required BOOLEAN DEFAULT false,
  level2_approved_by UUID,
  level2_approved_at TIMESTAMP WITH TIME ZONE,
  level2_notes TEXT,
  
  -- Level 3: Dean (Student Welfare)
  level3_required BOOLEAN DEFAULT false,
  level3_approved_by UUID,
  level3_approved_at TIMESTAMP WITH TIME ZONE,
  level3_notes TEXT,
  
  -- Overall status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_level2', 'awaiting_level3', 'approved', 'rejected', 'emergency_bypass')),
  rejection_reason TEXT,
  
  -- Emergency bypass
  is_emergency_bypass BOOLEAN DEFAULT false,
  bypass_reason TEXT,
  bypass_witness TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create priority assessment table
CREATE TABLE public.priority_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  assessing_doctor_id UUID REFERENCES public.medical_officers(id),
  medical_leave_request_id UUID REFERENCES public.medical_leave_requests(id),
  
  -- Priority level
  priority_level TEXT NOT NULL CHECK (priority_level IN ('standard', 'urgent', 'emergency')),
  
  -- Symptoms and assessment
  symptoms TEXT[] NOT NULL,
  vital_signs JSONB,
  clinical_notes TEXT,
  
  -- Ambulance decision
  ambulance_required BOOLEAN DEFAULT false,
  ambulance_type_recommended TEXT CHECK (ambulance_type_recommended IN ('bls', 'als', 'critical_care')),
  
  -- Leave requirement
  leave_required BOOLEAN DEFAULT false,
  leave_duration_category TEXT CHECK (leave_duration_category IN ('short', 'medium', 'extended', 'long_term')),
  recommended_leave_days INTEGER,
  
  -- Academic impact
  exams_affected TEXT[],
  labs_affected TEXT[],
  special_accommodations TEXT[],
  
  -- Modified plan if no leave
  modified_academic_plan JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approval_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_assessments ENABLE ROW LEVEL SECURITY;

-- RLS policies for ambulance_requests
CREATE POLICY "Doctors can create ambulance requests"
ON public.ambulance_requests FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can view ambulance requests"
ON public.ambulance_requests FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can update ambulance requests"
ON public.ambulance_requests FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ambulance requests"
ON public.ambulance_requests FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for leave_approval_workflow
CREATE POLICY "Doctors can manage leave approval workflow"
ON public.leave_approval_workflow FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for priority_assessments
CREATE POLICY "Doctors can manage priority assessments"
ON public.priority_assessments FOR ALL
USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own priority assessments"
ON public.priority_assessments FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_ambulance_requests_updated_at
BEFORE UPDATE ON public.ambulance_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_approval_workflow_updated_at
BEFORE UPDATE ON public.leave_approval_workflow
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_priority_assessments_updated_at
BEFORE UPDATE ON public.priority_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_ambulance_requests_student ON public.ambulance_requests(student_id);
CREATE INDEX idx_ambulance_requests_status ON public.ambulance_requests(status);
CREATE INDEX idx_ambulance_requests_priority ON public.ambulance_requests(priority_level);
CREATE INDEX idx_leave_approval_status ON public.leave_approval_workflow(status);
CREATE INDEX idx_priority_assessments_student ON public.priority_assessments(student_id);
CREATE INDEX idx_priority_assessments_priority ON public.priority_assessments(priority_level);