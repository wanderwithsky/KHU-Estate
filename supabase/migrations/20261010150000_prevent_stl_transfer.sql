-- Create a trigger to prevent STL application transfers
CREATE OR REPLACE FUNCTION prevent_stl_application_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the application role is Senior Team Leader
    IF OLD.role_applied_for = 'Senior Team Leader' THEN
        -- Check if either assigned_tl_id or assigned_stl_id is changing (which signifies a transfer)
        IF NEW.assigned_tl_id IS DISTINCT FROM OLD.assigned_tl_id OR 
           NEW.assigned_stl_id IS DISTINCT FROM OLD.assigned_stl_id THEN
            RAISE EXCEPTION 'STL accounts cannot be transferred.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_stl_transfer ON public.associate_applications;
CREATE TRIGGER trigger_prevent_stl_transfer
BEFORE UPDATE ON public.associate_applications
FOR EACH ROW
EXECUTE FUNCTION prevent_stl_application_transfer();
