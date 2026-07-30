-- 1. Drop redundant contact_messages table
DROP TABLE IF EXISTS public.contact_messages CASCADE;

-- 2. Add repondu and reponse columns to contacts table for tracking admin responses
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS repondu BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reponse TEXT;
