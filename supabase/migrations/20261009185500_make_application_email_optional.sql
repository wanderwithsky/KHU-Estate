-- Make email optional in associate_applications
ALTER TABLE public.associate_applications
ALTER COLUMN email DROP NOT NULL;
