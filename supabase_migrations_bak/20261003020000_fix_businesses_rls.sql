-- Fix businesses table RLS policies to correctly map auth.uid() to user_profiles

DROP POLICY IF EXISTS "Admin full access businesses" ON public.businesses;
CREATE POLICY "Admin full access businesses" 
ON public.businesses FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);

DROP POLICY IF EXISTS "Users can read own businesses" ON public.businesses;
CREATE POLICY "Users can read own businesses" 
ON public.businesses FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() 
        AND (
            businesses.assigned_user_id = user_profiles.id OR
            businesses.associate_id = user_profiles.id OR
            businesses.tl_id = user_profiles.id OR
            businesses.stl_id = user_profiles.id
        )
    )
);
