-- Set owner role for metoo.excel@gmail.com
-- This migration sets the user_type to 'owner' and user_plan to 'Pro' for the specified email

UPDATE public.profiles 
SET 
    user_type = 'owner',
    user_plan = 'Pro'
WHERE email = 'metoo.excel@gmail.com';

-- Verify the update
SELECT id, email, full_name, user_type, user_plan 
FROM public.profiles 
WHERE email = 'metoo.excel@gmail.com';

