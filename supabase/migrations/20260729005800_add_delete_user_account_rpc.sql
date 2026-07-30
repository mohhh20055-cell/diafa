-- Create the missing delete_user_account RPC function
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete related data first
    DELETE FROM public.notifications WHERE "userId" = p_user_id;
    DELETE FROM public.reservations WHERE "clientId" = p_user_id;
    -- Note: We need to be careful with cascading deletions for establishments/rooms
    -- For now, deleting reservations/notifications is a safe start
    
    -- Delete from the public.users table (or profiles, adjust if needed)
    DELETE FROM public.users WHERE id = p_user_id;
    
    -- Delete from the Supabase auth.users table
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
