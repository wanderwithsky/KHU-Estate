CREATE OR REPLACE FUNCTION public.debug_convert_lead()
RETURNS JSON AS $$
DECLARE
    v_lead RECORD;
    v_client_id UUID;
BEGIN
    SELECT * INTO v_lead FROM public.leads LIMIT 1;
    IF v_lead IS NULL THEN
        RETURN '{"error": "no leads"}'::json;
    END IF;

    -- try to convert
    SELECT public.convert_lead_to_client(v_lead.id) INTO v_client_id;
    
    RETURN json_build_object('client_id', v_client_id);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'state', SQLSTATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
