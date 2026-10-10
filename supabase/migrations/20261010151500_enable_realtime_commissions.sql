-- Enable realtime for commissions table
BEGIN;

  -- Ensure the table is in the supabase_realtime publication
  DO $$ 
  BEGIN 
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'commissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.commissions;
    END IF;
  END $$;

COMMIT;
