-- Fix RLS for login_sessions
CREATE POLICY "Users can insert own login_sessions" ON public.login_sessions 
FOR INSERT TO authenticated 
WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own login_sessions" ON public.login_sessions 
FOR UPDATE TO authenticated 
USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid())) 
WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can select own login_sessions" ON public.login_sessions 
FOR SELECT TO authenticated 
USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin select login_sessions" ON public.login_sessions 
FOR SELECT TO authenticated 
USING (is_admin());

-- Fix RLS for login_activity
CREATE POLICY "Users can insert own login_activity" ON public.login_activity 
FOR INSERT TO authenticated 
WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can select own login_activity" ON public.login_activity 
FOR SELECT TO authenticated 
USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admin select login_activity" ON public.login_activity 
FOR SELECT TO authenticated 
USING (is_admin());


