-- Add secure RPC to get auth user ID by email for reconciliation
CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = p_email 
    LIMIT 1;
    
    RETURN v_user_id;
END;
$$;

-- Ensure only authenticated users can execute it
REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(TEXT) TO authenticated, service_role;
