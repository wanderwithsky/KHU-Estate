
-- Admin can manage all leads
CREATE POLICY "Admin full access leads"
ON public.leads
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Assigned users can read their leads
CREATE POLICY "Assigned users can read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.user_profiles
    WHERE id = assigned_associate_id
       OR id = assigned_tl_id
       OR id = assigned_stl_id
  )
);

-- Assigned users can update their leads
CREATE POLICY "Assigned users can update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT auth_user_id FROM public.user_profiles
    WHERE id = assigned_associate_id
       OR id = assigned_tl_id
       OR id = assigned_stl_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM public.user_profiles
    WHERE id = assigned_associate_id
       OR id = assigned_tl_id
       OR id = assigned_stl_id
  )
);
