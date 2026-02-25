
-- Add photo_url column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url text;

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Allow authenticated users to upload their own photo
CREATE POLICY "Students can upload own photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Allow authenticated users to update their own photo
CREATE POLICY "Students can update own photo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Allow authenticated users to delete their own photo
CREATE POLICY "Students can delete own photo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: Allow anyone to view student photos (public bucket)
CREATE POLICY "Anyone can view student photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'student-photos');
