
-- Add new staff roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lab_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pharmacy';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'medical_staff';
