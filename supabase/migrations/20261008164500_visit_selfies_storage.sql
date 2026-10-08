-- 1. Create visit-selfies bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-selfies', 'visit-selfies', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can upload their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own selfies" ON storage.objects;

-- 3. Policy: Allow users to upload their own selfies (path matches auth_user_id)
CREATE POLICY "Users can upload their own selfies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'visit-selfies' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Allow users to view their own selfies
CREATE POLICY "Users can view their own selfies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'visit-selfies' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Allow Admins to view all selfies
-- Assuming admins have 'ADMIN' role in public.user_profiles
CREATE POLICY "Admins can view all selfies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'visit-selfies' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE auth_user_id = auth.uid() AND role = 'ADMIN'
    )
);

-- 6. Policy: Allow users to delete their own selfies (in case of cleanup during failed inserts)
CREATE POLICY "Users can delete their own selfies"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'visit-selfies' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
