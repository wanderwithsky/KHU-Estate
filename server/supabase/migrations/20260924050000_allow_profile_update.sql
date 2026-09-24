-- Allow users to update their own profile, specifically for clearing the must_change_password flag
CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth_user_id = auth.uid()) 
WITH CHECK (auth_user_id = auth.uid());
