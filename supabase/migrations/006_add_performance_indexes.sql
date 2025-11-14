-- Migration 006: Add performance indexes for profile fields
-- This migration adds indexes to improve query performance for profile-related operations

-- Add indexes for profile fields that might be searched or filtered
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON public.profiles(job_title) WHERE job_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_company_job ON public.profiles(company, job_title) 
    WHERE company IS NOT NULL AND job_title IS NOT NULL;

-- Add indexes for social media fields (useful for finding users by social profiles)
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin ON public.profiles(linkedin) 
    WHERE linkedin IS NOT NULL AND linkedin != '';
CREATE INDEX IF NOT EXISTS idx_profiles_twitter ON public.profiles(twitter) 
    WHERE twitter IS NOT NULL AND twitter != '';
CREATE INDEX IF NOT EXISTS idx_profiles_facebook ON public.profiles(facebook) 
    WHERE facebook IS NOT NULL AND facebook != '';

-- Add full-text search index for profiles (useful for searching users)
CREATE INDEX IF NOT EXISTS idx_profiles_fulltext_search ON public.profiles 
    USING gin(to_tsvector('english', 
        COALESCE(full_name, '') || ' ' || 
        COALESCE(company, '') || ' ' || 
        COALESCE(job_title, '') || ' ' || 
        COALESCE(department, '')
    ));

-- Add function for full-text search on profiles
CREATE OR REPLACE FUNCTION public.search_profiles(search_query TEXT)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    company TEXT,
    job_title TEXT,
    department TEXT,
    website TEXT,
    linkedin TEXT,
    twitter TEXT,
    facebook TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.avatar_url,
        p.company,
        p.job_title,
        p.department,
        p.website,
        p.linkedin,
        p.twitter,
        p.facebook,
        ts_rank(
            to_tsvector('english', 
                COALESCE(p.full_name, '') || ' ' || 
                COALESCE(p.company, '') || ' ' || 
                COALESCE(p.job_title, '') || ' ' || 
                COALESCE(p.department, '')
            ),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM public.profiles p
    WHERE to_tsvector('english', 
        COALESCE(p.full_name, '') || ' ' || 
        COALESCE(p.company, '') || ' ' || 
        COALESCE(p.job_title, '') || ' ' || 
        COALESCE(p.department, '')
    ) @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION public.search_profiles(TEXT) TO authenticated;

-- Create function to get profile statistics
CREATE OR REPLACE FUNCTION public.get_profile_stats()
RETURNS TABLE (
    total_users BIGINT,
    users_with_complete_profiles BIGINT,
    users_with_company_info BIGINT,
    users_with_social_links BIGINT,
    users_with_addresses BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.profiles) as total_users,
        (SELECT COUNT(*) FROM public.profiles 
         WHERE full_name IS NOT NULL 
         AND company IS NOT NULL 
         AND job_title IS NOT NULL) as users_with_complete_profiles,
        (SELECT COUNT(*) FROM public.profiles 
         WHERE company IS NOT NULL) as users_with_company_info,
        (SELECT COUNT(*) FROM public.profiles 
         WHERE linkedin IS NOT NULL 
         OR twitter IS NOT NULL 
         OR facebook IS NOT NULL 
         OR instagram IS NOT NULL) as users_with_social_links,
        (SELECT COUNT(DISTINCT user_id) FROM public.addresses) as users_with_addresses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the stats function
GRANT EXECUTE ON FUNCTION public.get_profile_stats() TO authenticated;

-- Create function to clean up orphaned data
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profile_data()
RETURNS void AS $$
BEGIN
    -- Delete addresses for users that no longer exist
    DELETE FROM public.addresses 
    WHERE user_id NOT IN (SELECT id FROM public.profiles);
    
    -- Update profiles table to remove references to deleted users
    -- This is handled by foreign key constraints, but we can add logging
    RAISE NOTICE 'Profile data cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled function to run cleanup (this would need to be set up with pg_cron if available)
-- For now, we'll just create the function
COMMENT ON FUNCTION public.cleanup_orphaned_profile_data() IS 
'Function to clean up orphaned profile data. Should be run periodically.';

-- Add comments to important columns for documentation
COMMENT ON COLUMN public.profiles.profile_image IS 'User profile image URL';
COMMENT ON COLUMN public.profiles.personal_phone IS 'Personal phone number (separate from work phone)';
COMMENT ON COLUMN public.profiles.company_logo IS 'Company logo URL';
COMMENT ON COLUMN public.profiles.department IS 'Department or division within company';
COMMENT ON COLUMN public.profiles.work_phone IS 'Work phone number (separate from personal phone)';
COMMENT ON COLUMN public.profiles.work_email IS 'Work email (separate from login email)';
COMMENT ON COLUMN public.profiles.line_id IS 'LINE ID for messaging';
COMMENT ON COLUMN public.addresses.type IS 'Address type: home, work, or other';
COMMENT ON COLUMN public.addresses.is_primary IS 'Whether this is the primary address for the user';
