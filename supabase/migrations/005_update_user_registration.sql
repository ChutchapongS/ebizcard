-- Migration 005: Update user registration function to handle new profile fields
-- This migration updates the handle_new_user function to include all new profile fields

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function to handle new user registration with all profile fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url,
        profile_image,
        personal_phone,
        company_logo,
        company,
        department,
        job_title,
        work_phone,
        work_email,
        website,
        facebook,
        line_id,
        linkedin,
        twitter,
        instagram
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'profile_image',
        NEW.raw_user_meta_data->>'personal_phone',
        NEW.raw_user_meta_data->>'company_logo',
        NEW.raw_user_meta_data->>'company',
        NEW.raw_user_meta_data->>'department',
        NEW.raw_user_meta_data->>'job_title',
        NEW.raw_user_meta_data->>'work_phone',
        NEW.raw_user_meta_data->>'work_email',
        NEW.raw_user_meta_data->>'website',
        NEW.raw_user_meta_data->>'facebook',
        NEW.raw_user_meta_data->>'line_id',
        NEW.raw_user_meta_data->>'linkedin',
        NEW.raw_user_meta_data->>'twitter',
        NEW.raw_user_meta_data->>'instagram'
    );
    
    -- Create initial addresses if they exist in metadata
    IF NEW.raw_user_meta_data ? 'addresses' AND jsonb_typeof(NEW.raw_user_meta_data->'addresses') = 'array' THEN
        PERFORM public.sync_addresses_from_metadata() FROM (SELECT NEW.*) AS user_data;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to migrate existing users' metadata to profiles table
CREATE OR REPLACE FUNCTION public.migrate_existing_user_metadata()
RETURNS void AS $$
BEGIN
    -- Update existing profiles with metadata from auth.users
    UPDATE public.profiles 
    SET
        full_name = COALESCE(
            (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profiles.id),
            profiles.full_name
        ),
        profile_image = COALESCE(
            (SELECT raw_user_meta_data->>'profile_image' FROM auth.users WHERE id = profiles.id),
            profiles.profile_image
        ),
        personal_phone = COALESCE(
            (SELECT raw_user_meta_data->>'personal_phone' FROM auth.users WHERE id = profiles.id),
            profiles.personal_phone
        ),
        company_logo = COALESCE(
            (SELECT raw_user_meta_data->>'company_logo' FROM auth.users WHERE id = profiles.id),
            profiles.company_logo
        ),
        company = COALESCE(
            (SELECT raw_user_meta_data->>'company' FROM auth.users WHERE id = profiles.id),
            profiles.company
        ),
        department = COALESCE(
            (SELECT raw_user_meta_data->>'department' FROM auth.users WHERE id = profiles.id),
            profiles.department
        ),
        job_title = COALESCE(
            (SELECT raw_user_meta_data->>'job_title' FROM auth.users WHERE id = profiles.id),
            profiles.job_title
        ),
        work_phone = COALESCE(
            (SELECT raw_user_meta_data->>'work_phone' FROM auth.users WHERE id = profiles.id),
            profiles.work_phone
        ),
        work_email = COALESCE(
            (SELECT raw_user_meta_data->>'work_email' FROM auth.users WHERE id = profiles.id),
            profiles.work_email
        ),
        website = COALESCE(
            (SELECT raw_user_meta_data->>'website' FROM auth.users WHERE id = profiles.id),
            profiles.website
        ),
        facebook = COALESCE(
            (SELECT raw_user_meta_data->>'facebook' FROM auth.users WHERE id = profiles.id),
            profiles.facebook
        ),
        line_id = COALESCE(
            (SELECT raw_user_meta_data->>'line_id' FROM auth.users WHERE id = profiles.id),
            profiles.line_id
        ),
        linkedin = COALESCE(
            (SELECT raw_user_meta_data->>'linkedin' FROM auth.users WHERE id = profiles.id),
            profiles.linkedin
        ),
        twitter = COALESCE(
            (SELECT raw_user_meta_data->>'twitter' FROM auth.users WHERE id = profiles.id),
            profiles.twitter
        ),
        instagram = COALESCE(
            (SELECT raw_user_meta_data->>'instagram' FROM auth.users WHERE id = profiles.id),
            profiles.instagram
        ),
        updated_at = NOW()
    WHERE EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = profiles.id 
        AND auth.users.raw_user_meta_data IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the migration for existing users
SELECT public.migrate_existing_user_metadata();

-- Drop the migration function as it's no longer needed
DROP FUNCTION IF EXISTS public.migrate_existing_user_metadata();
