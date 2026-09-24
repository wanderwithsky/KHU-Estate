-- Add role_applied_for to associate_applications
ALTER TABLE public.associate_applications
ADD COLUMN role_applied_for TEXT NOT NULL DEFAULT 'ASSOCIATE';

-- Add a comment explaining this table is now used for all roles
COMMENT ON TABLE public.associate_applications IS 'Stores applications for all roles (ASSOCIATE, TEAM_LEADER, SENIOR_TL).';
