
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_type TEXT NOT NULL DEFAULT 'contact' CHECK (submission_type IN ('contact', 'review', 'suggestion')),
  sender_role TEXT NOT NULL DEFAULT 'other' CHECK (sender_role IN ('student', 'professor', 'other')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  college_name TEXT,
  branch TEXT,
  year TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  ai_validation_status TEXT DEFAULT 'pending' CHECK (ai_validation_status IN ('pending', 'valid', 'spam', 'rejected')),
  ai_validation_notes TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (no auth required)
CREATE POLICY "Anyone can submit contact forms"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view all submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update (mark as read, etc)
CREATE POLICY "Admins can update submissions"
  ON public.contact_submissions
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete submissions"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
