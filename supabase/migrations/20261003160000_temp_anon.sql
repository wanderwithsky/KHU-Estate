CREATE POLICY "Temp Anon clients" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "Temp Anon leads" ON public.leads FOR SELECT TO anon USING (true);
CREATE POLICY "Temp Anon users" ON public.user_profiles FOR SELECT TO anon USING (true);
