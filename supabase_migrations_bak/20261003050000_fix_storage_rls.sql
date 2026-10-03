-- Fix Storage RLS policies for visit-selfies bucket
-- Ensure we are in the correct schema if needed, but storage policies are on storage.objects

-- 1. Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Admin can view all selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload selfies" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own selfies" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert selfies" ON storage.objects;

-- 2. Create INSERT policy
-- Allows users to upload files ONLY to a folder that matches their auth.uid()
CREATE POLICY "Users can upload own selfies" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'visit-selfies' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Create SELECT policy for the user
-- Allows users to read files ONLY from a folder that matches their auth.uid()
CREATE POLICY "Users can view own selfies" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'visit-selfies' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Create SELECT policy for Admins
CREATE POLICY "Admin can view all selfies" 
ON storage.objects FOR SELECT 
USING (
    bucket_id = 'visit-selfies' AND
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.auth_user_id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
);
