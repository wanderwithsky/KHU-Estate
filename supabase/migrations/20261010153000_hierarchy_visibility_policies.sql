-- 20261010153000_hierarchy_visibility_policies.sql

-- 1. Businesses Table Policies
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access businesses" ON public.businesses;
CREATE POLICY "Admin full access businesses" ON public.businesses 
FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read team businesses" ON public.businesses;
CREATE POLICY "Users read team businesses" ON public.businesses 
FOR SELECT TO authenticated USING (
    associate_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
    tl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()) OR
    stl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
);

-- 2. Commissions Table Policies
DROP POLICY IF EXISTS "Users read own commissions" ON public.commissions;

DROP POLICY IF EXISTS "Users read team commissions" ON public.commissions;
CREATE POLICY "Users read team commissions" ON public.commissions 
FOR SELECT TO authenticated USING (
    user_id IN (
        SELECT id FROM public.user_profiles 
        WHERE auth_user_id = auth.uid() 
        OR parent_user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
        OR senior_tl_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())
    )
);
