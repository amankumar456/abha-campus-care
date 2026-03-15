
-- Doctor shifts table - tracks daily shift schedules
CREATE TABLE public.doctor_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.medical_officers(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00',
  is_modified boolean DEFAULT false,
  modified_by uuid REFERENCES public.medical_officers(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, shift_date)
);

-- Shift exchanges table - tracks exchange requests and transfers
CREATE TABLE public.shift_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_doctor_id uuid NOT NULL REFERENCES public.medical_officers(id),
  replacement_doctor_id uuid NOT NULL REFERENCES public.medical_officers(id),
  shift_date date NOT NULL,
  original_start_time time NOT NULL,
  original_end_time time NOT NULL,
  new_start_time time NOT NULL,
  new_end_time time NOT NULL,
  exchange_reason text,
  status text NOT NULL DEFAULT 'pending',
  transferred_appointments_count integer DEFAULT 0,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_exchanges ENABLE ROW LEVEL SECURITY;

-- RLS for doctor_shifts
CREATE POLICY "Doctors can view all shifts"
  ON public.doctor_shifts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can insert own shifts"
  ON public.doctor_shifts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can update own shifts"
  ON public.doctor_shifts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'doctor'::app_role));

-- RLS for shift_exchanges
CREATE POLICY "Doctors can view shift exchanges"
  ON public.shift_exchanges FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can create shift exchanges"
  ON public.shift_exchanges FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'doctor'::app_role));

CREATE POLICY "Doctors can update shift exchanges"
  ON public.shift_exchanges FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'doctor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for shift exchanges
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_exchanges;
