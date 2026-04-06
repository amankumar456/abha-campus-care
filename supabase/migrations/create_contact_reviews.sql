-- Create contact_reviews table
CREATE TABLE IF NOT EXISTS public.contact_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type TEXT NOT NULL CHECK (form_type IN ('contact', 'review')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  college TEXT,
  branch TEXT,
  year TEXT,
  rating INTEGER,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_reviews ENABLE ROW LEVEL SECURITY;

-- Allow insert for everyone (public)
CREATE POLICY "allow_public_insert" ON public.contact_reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow select for everyone
CREATE POLICY "allow_public_select" ON public.contact_reviews
  FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_contact_reviews_form_type ON public.contact_reviews(form_type);
CREATE INDEX idx_contact_reviews_submitted_at ON public.contact_reviews(submitted_at DESC);
CREATE INDEX idx_contact_reviews_created_at ON public.contact_reviews(created_at DESC);

-- Add realtime subscription
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_reviews;

-- Grant permissions
GRANT SELECT, INSERT ON public.contact_reviews TO anon;
GRANT SELECT, INSERT ON public.contact_reviews TO authenticated;
