-- 1. Create a function to get downline IDs for STLs to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_stl_downline_ids(stl_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY 
  SELECT id FROM public.user_profiles WHERE parent_user_id = stl_uuid OR senior_tl_id = stl_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the STL policy
DROP POLICY IF EXISTS "STL sees team" ON public.user_profiles;
CREATE POLICY "STL sees team" ON public.user_profiles FOR SELECT TO authenticated USING (
    get_my_role() = 'SENIOR_TL' AND (
        senior_tl_id = get_my_profile_id() OR
        parent_user_id = get_my_profile_id() OR
        parent_user_id IN (SELECT public.get_stl_downline_ids(get_my_profile_id()))
    )
);
