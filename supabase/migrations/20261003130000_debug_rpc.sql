CREATE OR REPLACE FUNCTION public.get_all_clients()
RETURNS JSON AS $$
BEGIN
    RETURN (SELECT json_agg(t) FROM (SELECT * FROM public.clients) t);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
