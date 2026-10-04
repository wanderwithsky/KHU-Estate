-- Drop both existing overloads of the function to remove ambiguity
DROP FUNCTION IF EXISTS public.generate_user_code(text);
DROP FUNCTION IF EXISTS public.generate_user_code(app_role);

-- Create the canonical version using the app_role enum for strong typing
CREATE OR REPLACE FUNCTION public.generate_user_code(role_type public.app_role) RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    seq_val INT;
    new_code TEXT;
BEGIN
    IF role_type = 'ADMIN' THEN 
        prefix := 'ADMIN';
        EXECUTE 'SELECT nextval(''ADMIN_seq'')' INTO seq_val;
        new_code := prefix || LPAD(seq_val::TEXT, 3, '0');
    ELSIF role_type = 'SENIOR_TL' THEN 
        prefix := 'STL';
        EXECUTE 'SELECT nextval(''STL_seq'')' INTO seq_val;
        new_code := prefix || LPAD(seq_val::TEXT, 3, '0');
    ELSIF role_type = 'TEAM_LEADER' THEN 
        prefix := 'TL';
        EXECUTE 'SELECT nextval(''TL_seq'')' INTO seq_val;
        new_code := prefix || LPAD(seq_val::TEXT, 3, '0');
    ELSE 
        prefix := 'ASSOC';
        EXECUTE 'SELECT nextval(''ASSOC_seq'')' INTO seq_val;
        new_code := prefix || LPAD(seq_val::TEXT, 4, '0');
    END IF;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Sync sequences with the maximum value currently in the table to prevent duplicate key errors
DO $$ 
DECLARE
    max_admin INT;
    max_stl INT;
    max_tl INT;
    max_assoc INT;
BEGIN
    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(user_code, '\D', '', 'g'), '') AS INT)), 0) INTO max_admin FROM public.user_profiles WHERE user_code LIKE 'ADMIN%';
    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(user_code, '\D', '', 'g'), '') AS INT)), 0) INTO max_stl FROM public.user_profiles WHERE user_code LIKE 'STL%';
    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(user_code, '\D', '', 'g'), '') AS INT)), 0) INTO max_tl FROM public.user_profiles WHERE user_code LIKE 'TL%';
    SELECT COALESCE(MAX(CAST(NULLIF(regexp_replace(user_code, '\D', '', 'g'), '') AS INT)), 0) INTO max_assoc FROM public.user_profiles WHERE user_code LIKE 'ASSOC%';

    IF max_admin > 0 THEN PERFORM setval('ADMIN_seq', max_admin, true); ELSE PERFORM setval('ADMIN_seq', 1, false); END IF;
    IF max_stl > 0 THEN PERFORM setval('STL_seq', max_stl, true); ELSE PERFORM setval('STL_seq', 1, false); END IF;
    IF max_tl > 0 THEN PERFORM setval('TL_seq', max_tl, true); ELSE PERFORM setval('TL_seq', 1, false); END IF;
    IF max_assoc > 0 THEN PERFORM setval('ASSOC_seq', max_assoc, true); ELSE PERFORM setval('ASSOC_seq', 1, false); END IF;
END $$;
