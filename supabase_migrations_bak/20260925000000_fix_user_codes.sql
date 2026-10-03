-- Function to safely generate user code
CREATE OR REPLACE FUNCTION generate_user_code(role_type TEXT) RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_num INT;
    new_code TEXT;
BEGIN
    IF role_type = 'ADMIN' THEN
        prefix := 'ADMIN';
    ELSIF role_type = 'SENIOR_TL' THEN
        prefix := 'STL';
    ELSIF role_type = 'TEAM_LEADER' THEN
        prefix := 'TL';
    ELSIF role_type = 'ASSOCIATE' THEN
        prefix := 'ASSOC';
    ELSE
        prefix := 'USER';
    END IF;
    
    -- Lock table for concurrent insertions (handled by pg) or use a sequence
    -- For simplicity, we just find the max code with the given prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(user_code FROM LENGTH(prefix) + 1) AS INT)), 0) + 1
    INTO next_num
    FROM user_profiles
    WHERE user_code LIKE prefix || '%';
    IF role_type = 'ASSOCIATE' THEN
        new_code := prefix || LPAD(next_num::TEXT, 4, '0');
    ELSE
        new_code := prefix || LPAD(next_num::TEXT, 3, '0');
    END IF;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Backfill missing user codes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, role FROM public.user_profiles WHERE user_code IS NULL OR user_code = '' LOOP
        UPDATE public.user_profiles 
        SET user_code = generate_user_code(r.role)
        WHERE id = r.id;
    END LOOP;
END;
$$;
