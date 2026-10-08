-- 1. Make associate_id nullable to preserve history when users are deleted
ALTER TABLE public.businesses ALTER COLUMN associate_id DROP NOT NULL;
ALTER TABLE public.site_visits ALTER COLUMN associate_id DROP NOT NULL;
ALTER TABLE public.businesses ALTER COLUMN deal_amount DROP NOT NULL; -- just in case, but probably not needed

-- 2. Modify foreign keys to ON DELETE SET NULL to preserve history

-- Function to safely change a foreign key constraint to ON DELETE SET NULL
CREATE OR REPLACE FUNCTION set_fk_on_delete_set_null(
    p_table_name text,
    p_column_name text,
    p_ref_table text,
    p_ref_column text
) RETURNS void AS $$
DECLARE
    v_constraint_name text;
BEGIN
    -- Find the existing constraint name
    SELECT tc.constraint_name INTO v_constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = p_table_name
      AND kcu.column_name = p_column_name
      AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;

    -- Drop the existing constraint if found
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', p_table_name, v_constraint_name);
    END IF;

    -- Add the new constraint with ON DELETE SET NULL
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE SET NULL',
                   p_table_name, p_table_name || '_' || p_column_name || '_fkey', p_column_name, p_ref_table, p_ref_column);
END;
$$ LANGUAGE plpgsql;

-- Apply to tables where historical records must be preserved
SELECT set_fk_on_delete_set_null('businesses', 'associate_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('businesses', 'tl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('businesses', 'stl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('businesses', 'created_by', 'user_profiles', 'id');

SELECT set_fk_on_delete_set_null('site_visits', 'associate_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('site_visits', 'tl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('site_visits', 'stl_id', 'user_profiles', 'id');

SELECT set_fk_on_delete_set_null('leads', 'assigned_associate_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('leads', 'assigned_tl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('leads', 'assigned_stl_id', 'user_profiles', 'id');

SELECT set_fk_on_delete_set_null('clients', 'assigned_associate_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('clients', 'assigned_tl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('clients', 'assigned_stl_id', 'user_profiles', 'id');

SELECT set_fk_on_delete_set_null('associate_applications', 'assigned_tl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('associate_applications', 'assigned_stl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('associate_applications', 'reviewed_by', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('associate_applications', 'created_account_user_id', 'user_profiles', 'id');

SELECT set_fk_on_delete_set_null('application_history', 'actor_user_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('plot_status_history', 'changed_by', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('business_history', 'actor_user_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('audit_logs', 'actor_user_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('email_logs', 'recipient_user_id', 'user_profiles', 'id');

SELECT set_fk_on_delete_set_null('teams', 'senior_tl_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('teams', 'team_leader_id', 'user_profiles', 'id');

-- For login_activity, we can just cascade since it's personal
CREATE OR REPLACE FUNCTION set_fk_on_delete_cascade(
    p_table_name text,
    p_column_name text,
    p_ref_table text,
    p_ref_column text
) RETURNS void AS $$
DECLARE
    v_constraint_name text;
BEGIN
    SELECT tc.constraint_name INTO v_constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = p_table_name
      AND kcu.column_name = p_column_name
      AND tc.constraint_type = 'FOREIGN KEY'
    LIMIT 1;

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', p_table_name, v_constraint_name);
    END IF;

    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE CASCADE',
                   p_table_name, p_table_name || '_' || p_column_name || '_fkey', p_column_name, p_ref_table, p_ref_column);
END;
$$ LANGUAGE plpgsql;

SELECT set_fk_on_delete_cascade('login_activity', 'user_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_cascade('notifications', 'recipient_user_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_cascade('sponsor_relationships', 'referred_user_id', 'user_profiles', 'id');
SELECT set_fk_on_delete_set_null('sponsor_relationships', 'sponsor_user_id', 'user_profiles', 'id');

-- Clean up helper functions
DROP FUNCTION set_fk_on_delete_set_null;
DROP FUNCTION set_fk_on_delete_cascade;

-- 3. Create cleanup and deletion RPC
-- Since we are doing server-side edge function deletion, the edge function will call this RPC to prepare cleanup if necessary.
-- But wait! Now that we have set everything to CASCADE or SET NULL, we don't need a complex manual cleanup RPC for foreign keys.
-- We just need an RPC to handle session termination, audit log, and return success so Edge Function can just delete the Auth user.

CREATE OR REPLACE FUNCTION public.prepare_user_deletion(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
BEGIN
    -- Auth check
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Can only delete own account';
    END IF;

    -- Fetch profile
    SELECT * INTO v_profile FROM public.user_profiles WHERE id = p_user_id;
    IF v_profile IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Block ADMIN
    IF v_profile.role = 'ADMIN' THEN
        RAISE EXCEPTION 'Account deletion is disabled for Administrator accounts.';
    END IF;

    -- End active sessions
    UPDATE public.login_sessions 
    SET status = 'ENDED', logout_at = now() 
    WHERE user_id = p_user_id AND status = 'ACTIVE';

    -- Audit Log (keep a record of self-deletion with basic info)
    -- actor_user_id is set to null after profile is deleted, but metadata keeps the user_code
    INSERT INTO public.audit_logs (action, module, metadata)
    VALUES (
        'USER_SELF_DELETED_ACCOUNT',
        'SETTINGS',
        jsonb_build_object(
            'user_id', p_user_id,
            'auth_user_id', v_profile.auth_user_id,
            'user_code', v_profile.user_code,
            'role', v_profile.role,
            'name', v_profile.full_name,
            'email', v_profile.email
        )
    );

    RETURN jsonb_build_object('success', true, 'auth_user_id', v_profile.auth_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
