DO $$
DECLARE
    new_email text := 'khudevelopers.pvtltd@gmail.com';
    old_email text := 'admin@khuestate.com';
    existing_user_id uuid;
    admin_user_id uuid;
BEGIN
    -- 1. Check if the new email is already registered
    SELECT id INTO existing_user_id FROM auth.users WHERE email = new_email;
    IF existing_user_id IS NOT NULL THEN
        RAISE EXCEPTION 'Conflict: The new email % is already registered.', new_email;
    END IF;

    -- 2. Find the current admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = old_email;
    IF admin_user_id IS NULL THEN
        -- If already updated or not found, silently succeed.
        RETURN;
    END IF;

    -- 3. Update auth.users (Preserves UUID, password, and permissions)
    UPDATE auth.users 
    SET email = new_email, 
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = admin_user_id;

    -- 4. Update public.user_profiles
    UPDATE public.user_profiles
    SET email = new_email
    WHERE auth_user_id = admin_user_id;
END $$;
