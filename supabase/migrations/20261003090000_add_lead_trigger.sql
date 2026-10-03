-- Function to auto-generate lead_number
CREATE OR REPLACE FUNCTION public.generate_lead_number()
RETURNS TRIGGER AS $$
DECLARE
    date_str TEXT;
    random_hex TEXT;
BEGIN
    -- Only generate if not provided (e.g. from public contact form)
    IF NEW.lead_number IS NULL THEN
        date_str := to_char(now(), 'YYYYMMDD');
        random_hex := lpad(to_hex(floor(random() * 65535)::int), 4, '0');
        NEW.lead_number := 'LD-' || date_str || '-' || upper(random_hex);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute generation before insert
DROP TRIGGER IF EXISTS trigger_generate_lead_number ON public.leads;
CREATE TRIGGER trigger_generate_lead_number
BEFORE INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.generate_lead_number();
