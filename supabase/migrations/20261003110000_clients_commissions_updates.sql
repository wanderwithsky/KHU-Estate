-- 1. Clients Table Updates
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id);

CREATE OR REPLACE FUNCTION public.generate_client_number()
RETURNS TRIGGER AS $$
DECLARE
    date_str TEXT;
    random_hex TEXT;
BEGIN
    IF NEW.client_number IS NULL THEN
        date_str := to_char(now(), 'YYYYMMDD');
        random_hex := lpad(to_hex(floor(random() * 65535)::int), 4, '0');
        NEW.client_number := 'CL-' || date_str || '-' || upper(random_hex);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_client_number ON public.clients;
CREATE TRIGGER trigger_generate_client_number
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.generate_client_number();

-- 2. Commissions Table Updates
CREATE OR REPLACE FUNCTION public.generate_commission_number()
RETURNS TRIGGER AS $$
DECLARE
    date_str TEXT;
    random_hex TEXT;
BEGIN
    IF NEW.commission_number IS NULL THEN
        date_str := to_char(now(), 'YYYYMMDD');
        random_hex := lpad(to_hex(floor(random() * 65535)::int), 4, '0');
        NEW.commission_number := 'CM-' || date_str || '-' || upper(random_hex);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_commission_number ON public.commissions;
CREATE TRIGGER trigger_generate_commission_number
BEFORE INSERT ON public.commissions
FOR EACH ROW
EXECUTE FUNCTION public.generate_commission_number();

-- 3. Clients RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access clients" ON public.clients;
CREATE POLICY "Admin full access clients" ON public.clients FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Assigned read clients" ON public.clients;
CREATE POLICY "Assigned read clients" ON public.clients FOR SELECT TO authenticated USING (
    auth.uid() IN (
        SELECT auth_user_id FROM public.user_profiles
        WHERE id IN (assigned_associate_id, assigned_tl_id, assigned_stl_id)
    )
);

-- 4. Commissions RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access commissions" ON public.commissions;
CREATE POLICY "Admin full access commissions" ON public.commissions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users read own commissions" ON public.commissions;
CREATE POLICY "Users read own commissions" ON public.commissions FOR SELECT TO authenticated USING (
    user_id IN (
        SELECT id FROM public.user_profiles WHERE auth_user_id = auth.uid()
    )
);
