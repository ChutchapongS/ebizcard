-- Add unique constraint on (user_id, type) for addresses table
-- This allows upsert operations to work properly
-- Note: This assumes addresses table uses 'type' field with values like 'personal_1', 'personal_2', 'work_1', 'work_2', etc.

-- First, update the CHECK constraint to allow the actual types used in the application
-- The application uses: 'personal_1', 'personal_2', 'work_1', 'work_2', and potentially 'home', 'work', 'other'
DO $$
BEGIN
    -- Drop the old CHECK constraint if it exists
    ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_type_check;
    
    -- Add new CHECK constraint that allows both old and new type values
    ALTER TABLE public.addresses 
    ADD CONSTRAINT addresses_type_check 
    CHECK (type IN ('home', 'work', 'other', 'personal_1', 'personal_2', 'work_1', 'work_2'));
END $$;

-- Remove any duplicate entries first (keep the oldest one)
DO $$
BEGIN
    DELETE FROM public.addresses a1
    WHERE EXISTS (
        SELECT 1 FROM public.addresses a2
        WHERE a2.user_id = a1.user_id
        AND a2.type = a1.type
        AND a2.id < a1.id
    );
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'addresses_user_id_type_key'
    ) THEN
        ALTER TABLE public.addresses
        ADD CONSTRAINT addresses_user_id_type_key UNIQUE (user_id, type);
    END IF;
END $$;

-- Create index if it doesn't exist (for better performance)
CREATE INDEX IF NOT EXISTS idx_addresses_user_id_type ON public.addresses(user_id, type);

