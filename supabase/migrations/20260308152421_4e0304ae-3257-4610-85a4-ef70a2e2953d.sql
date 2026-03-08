
-- Allow lab officers to read files from lab-reports bucket
CREATE POLICY "Lab officers can read lab reports files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lab-reports'
  AND (
    public.has_role(auth.uid(), 'lab_officer'::public.app_role)
    OR public.has_role(auth.uid(), 'doctor'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Allow lab officers to upload to lab-reports bucket
CREATE POLICY "Lab officers can upload lab reports files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-reports'
  AND (
    public.has_role(auth.uid(), 'lab_officer'::public.app_role)
    OR public.has_role(auth.uid(), 'doctor'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Allow students to view their own lab report files
CREATE POLICY "Students can read own lab report files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lab-reports'
  AND public.has_role(auth.uid(), 'student'::public.app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT s.id::text FROM public.students s WHERE s.user_id = auth.uid()
  )
);
