-- Change template_id foreign key constraint from ON DELETE SET NULL to ON DELETE RESTRICT
-- This prevents deletion of templates that are still in use by business cards
-- Important for business logic: prevents users from bypassing template limits

-- First, drop the existing foreign key constraint
ALTER TABLE public.business_cards 
DROP CONSTRAINT IF EXISTS business_cards_template_id_fkey;

-- Re-add the constraint with ON DELETE RESTRICT
ALTER TABLE public.business_cards 
ADD CONSTRAINT business_cards_template_id_fkey 
FOREIGN KEY (template_id) 
REFERENCES public.templates(id) 
ON DELETE RESTRICT;

-- Add comment to explain the restriction
COMMENT ON CONSTRAINT business_cards_template_id_fkey ON public.business_cards IS 
'Prevents deletion of templates that are in use by business cards. Users must delete or reassign cards before deleting a template. This enforces template quota limits.';

