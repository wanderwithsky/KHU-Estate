-- Add flat fields for admin visit scheduling and user field reporting
ALTER TABLE public.site_visits
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS project_name TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id);

-- Relax outdated constraints
ALTER TABLE public.site_visits ALTER COLUMN associate_id DROP NOT NULL;
ALTER TABLE public.site_visits ALTER COLUMN visit_number DROP NOT NULL;

-- Fix site_visits RLS policies
DROP POLICY IF EXISTS "Admin full access site_visits" ON public.site_visits;
CREATE POLICY "Admin full access site_visits" 
ON public.site_visits FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);

DROP POLICY IF EXISTS "Users can read/update own site_visits" ON public.site_visits;
CREATE POLICY "Users can read/update own site_visits" 
ON public.site_visits FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() 
        AND (
            site_visits.assigned_user_id = user_profiles.id OR
            site_visits.associate_id = user_profiles.id OR
            site_visits.tl_id = user_profiles.id OR
            site_visits.stl_id = user_profiles.id
        )
    )
);

-- Create secure storage bucket for visit selfies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visit-selfies', 'visit-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for visit-selfies
-- 1. Admin can view all
CREATE POLICY "Admin can view all selfies" ON storage.objects FOR SELECT
USING (
    bucket_id = 'visit-selfies' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);

-- 2. Authenticated users can insert selfies
CREATE POLICY "Users can upload selfies" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'visit-selfies' AND
    auth.uid() = owner
);

-- 3. Users can read own uploaded selfies
CREATE POLICY "Users can view own selfies" ON storage.objects FOR SELECT
USING (
    bucket_id = 'visit-selfies' AND
    auth.uid() = owner
);
