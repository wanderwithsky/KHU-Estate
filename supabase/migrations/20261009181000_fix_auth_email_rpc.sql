-- ==============================================================================
-- Function: get_auth_email_by_login_id
-- Description: Retrieves the exact Auth email for a given login ID / user_code.
-- Allows users to login with their username/ID securely without exposing data.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_email_by_login_id(p_login_id TEXT)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_user_id UUID;
    v_auth_email TEXT;
BEGIN
    -- Only allow lookup if the user profile exists and is active/pending
    SELECT auth_user_id INTO v_auth_user_id
    FROM public.user_profiles
    WHERE user_code = p_login_id
      AND status IN ('ACTIVE', 'PENDING')
    LIMIT 1;

    IF v_auth_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Look up the actual email used in auth.users
    SELECT email INTO v_auth_email
    FROM auth.users
    WHERE id = v_auth_user_id;

    RETURN v_auth_email;
END;
$$ LANGUAGE plpgsql;

-- Grant execution to public so it can be called during unauthenticated login
GRANT EXECUTE ON FUNCTION public.get_auth_email_by_login_id(TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.get_auth_email_by_login_id(TEXT) TO anon;
