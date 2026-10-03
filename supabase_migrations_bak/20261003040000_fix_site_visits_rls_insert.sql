-- Fix site_visits RLS INSERT policy
-- Drop existing user policy to recreate cleanly
DROP POLICY IF EXISTS "Users can read/update own site_visits" ON public.site_visits;
DROP POLICY IF EXISTS "Users can insert own site_visits" ON public.site_visits;

-- 1. SELECT / UPDATE / DELETE policy
CREATE POLICY "Users can read/update own site_visits" 
ON public.site_visits 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() 
        AND (
            site_visits.assigned_user_id = user_profiles.id OR
            site_visits.created_by = user_profiles.id OR
            site_visits.associate_id = user_profiles.id OR
            site_visits.tl_id = user_profiles.id OR
            site_visits.stl_id = user_profiles.id
        )
    )
);

-- 2. Explicit INSERT policy using WITH CHECK
CREATE POLICY "Users can insert own site_visits" 
ON public.site_visits 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() 
        AND (
            assigned_user_id = user_profiles.id OR
            created_by = user_profiles.id OR
            associate_id = user_profiles.id
        )
    )
);
