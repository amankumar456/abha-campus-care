CREATE OR REPLACE FUNCTION public.get_health_centre_stats()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'active_students', (SELECT COUNT(*) FROM students),
    'completed_appointments', (SELECT COUNT(*) FROM appointments WHERE status = 'completed'),
    'doctor_count', (SELECT COUNT(*) FROM medical_officers)
  )
$$;