CREATE OR REPLACE FUNCTION public.debug_clients_query()
RETURNS JSON AS $$
BEGIN
    RETURN (
        SELECT json_agg(t) FROM (
            SELECT c.*, l.lead_number 
            FROM public.clients c
            LEFT JOIN public.leads l ON c.lead_id = l.id
        ) t
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
