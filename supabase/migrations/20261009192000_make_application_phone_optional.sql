-- Make phone optional in associate_applications
ALTER TABLE public.associate_applications
ALTER COLUMN phone DROP NOT NULL;
