-- Add user plan system for granular permission control
-- User types: Free, Standard, Pro (for regular users)
-- Admin and Owner always have Pro level access

-- Add user_plan column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'Free' CHECK (user_plan IN ('Free', 'Standard', 'Pro'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_plan ON public.profiles(user_plan);

-- Update existing users to have appropriate plans
-- Admin and Owner users get Pro plan automatically
UPDATE public.profiles 
SET user_plan = 'Pro' 
WHERE user_type IN ('admin', 'owner');

-- Regular users keep Free plan as default (already set by DEFAULT)

-- Create function to get effective user plan
-- This ensures Admin/Owner always have Pro access regardless of their user_plan setting
CREATE OR REPLACE FUNCTION get_effective_user_plan(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_type TEXT;
    user_plan TEXT;
BEGIN
    -- Get user type and plan
    SELECT p.user_type, p.user_plan INTO user_type, user_plan
    FROM public.profiles p
    WHERE p.id = user_id;
    
    -- Admin and Owner always have Pro access
    IF user_type IN ('admin', 'owner') THEN
        RETURN 'Pro';
    END IF;
    
    -- Return the actual plan for regular users
    RETURN COALESCE(user_plan, 'Free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has specific plan or higher
-- Plan hierarchy: Free < Standard < Pro
CREATE OR REPLACE FUNCTION has_plan_or_higher(user_id UUID, required_plan TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    effective_plan TEXT;
BEGIN
    effective_plan := get_effective_user_plan(user_id);
    
    -- Define plan hierarchy
    CASE required_plan
        WHEN 'Free' THEN
            RETURN TRUE; -- Everyone has Free access
        WHEN 'Standard' THEN
            RETURN effective_plan IN ('Standard', 'Pro');
        WHEN 'Pro' THEN
            RETURN effective_plan = 'Pro';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for easy access to user plan information
CREATE OR REPLACE VIEW user_plan_info AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.user_type,
    p.user_plan,
    get_effective_user_plan(p.id) as effective_plan,
    CASE 
        WHEN p.user_type IN ('admin', 'owner') THEN 'Pro (Admin/Owner)'
        ELSE p.user_plan
    END as display_plan
FROM public.profiles p;

-- Grant permissions
GRANT SELECT ON user_plan_info TO anon, authenticated;

-- Update RLS policies if needed (existing policies should still work)
-- The new columns inherit the existing RLS policies

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.user_plan IS 'User subscription plan: Free, Standard, Pro. Admin/Owner users automatically have Pro access.';
COMMENT ON FUNCTION get_effective_user_plan(UUID) IS 'Returns the effective user plan, ensuring Admin/Owner always have Pro access';
COMMENT ON FUNCTION has_plan_or_higher(UUID, TEXT) IS 'Checks if user has the required plan or higher based on plan hierarchy';

-- Example usage queries (for reference):
-- SELECT get_effective_user_plan('user-uuid-here');
-- SELECT has_plan_or_higher('user-uuid-here', 'Standard');
-- SELECT * FROM user_plan_info WHERE effective_plan = 'Pro';
