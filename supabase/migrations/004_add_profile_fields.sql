-- Migration 004: Add comprehensive profile fields
-- This migration adds all the profile fields used in the Settings page

-- Add profile fields to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS personal_phone TEXT,
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS work_phone TEXT,
ADD COLUMN IF NOT EXISTS work_email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS line_id TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create addresses table for multiple addresses per user
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'other')),
    address TEXT NOT NULL,
    district TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Thailand',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for addresses table
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);
CREATE INDEX IF NOT EXISTS idx_addresses_is_primary ON public.addresses(is_primary);

-- Create updated_at trigger for addresses table
CREATE TRIGGER set_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create updated_at trigger for profiles table
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security for addresses table
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for addresses
CREATE POLICY "Users can view own addresses" ON public.addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON public.addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Add function to ensure only one primary address per user
CREATE OR REPLACE FUNCTION public.ensure_single_primary_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If this address is being set as primary, unset all other primary addresses for this user
    IF NEW.is_primary = true THEN
        UPDATE public.addresses 
        SET is_primary = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to ensure only one primary address per user
CREATE TRIGGER ensure_single_primary_address_trigger
    BEFORE INSERT OR UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_primary_address();

-- Create function to handle profile updates from user metadata
CREATE OR REPLACE FUNCTION public.update_profile_from_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile fields from user metadata
    UPDATE public.profiles SET
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        profile_image = COALESCE(NEW.raw_user_meta_data->>'profile_image', profile_image),
        personal_phone = COALESCE(NEW.raw_user_meta_data->>'personal_phone', personal_phone),
        company_logo = COALESCE(NEW.raw_user_meta_data->>'company_logo', company_logo),
        company = COALESCE(NEW.raw_user_meta_data->>'company', company),
        department = COALESCE(NEW.raw_user_meta_data->>'department', department),
        job_title = COALESCE(NEW.raw_user_meta_data->>'job_title', job_title),
        work_phone = COALESCE(NEW.raw_user_meta_data->>'work_phone', work_phone),
        work_email = COALESCE(NEW.raw_user_meta_data->>'work_email', work_email),
        website = COALESCE(NEW.raw_user_meta_data->>'website', website),
        facebook = COALESCE(NEW.raw_user_meta_data->>'facebook', facebook),
        line_id = COALESCE(NEW.raw_user_meta_data->>'line_id', line_id),
        linkedin = COALESCE(NEW.raw_user_meta_data->>'linkedin', linkedin),
        twitter = COALESCE(NEW.raw_user_meta_data->>'twitter', twitter),
        instagram = COALESCE(NEW.raw_user_meta_data->>'instagram', instagram),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating profile from user metadata
CREATE TRIGGER on_auth_user_metadata_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.update_profile_from_metadata();

-- Create function to sync addresses from user metadata
CREATE OR REPLACE FUNCTION public.sync_addresses_from_metadata()
RETURNS TRIGGER AS $$
DECLARE
    address_item JSONB;
    address_id UUID;
BEGIN
    -- Clear existing addresses for this user
    DELETE FROM public.addresses WHERE user_id = NEW.id;
    
    -- Insert addresses from metadata if they exist
    IF NEW.raw_user_meta_data ? 'addresses' AND jsonb_typeof(NEW.raw_user_meta_data->'addresses') = 'array' THEN
        FOR address_item IN SELECT * FROM jsonb_array_elements(NEW.raw_user_meta_data->'addresses')
        LOOP
            INSERT INTO public.addresses (
                user_id,
                type,
                address,
                district,
                province,
                postal_code,
                country,
                is_primary
            ) VALUES (
                NEW.id,
                COALESCE(address_item->>'type', 'home'),
                address_item->>'address',
                address_item->>'district',
                address_item->>'province',
                address_item->>'postalCode',
                COALESCE(address_item->>'country', 'Thailand'),
                false
            );
        END LOOP;
        
        -- Set first address as primary if no primary is set
        UPDATE public.addresses 
        SET is_primary = true 
        WHERE user_id = NEW.id 
        AND id = (
            SELECT id FROM public.addresses 
            WHERE user_id = NEW.id 
            ORDER BY created_at ASC 
            LIMIT 1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for syncing addresses from user metadata
CREATE TRIGGER on_auth_user_addresses_sync
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
    EXECUTE FUNCTION public.sync_addresses_from_metadata();

-- Create view for complete user profile
CREATE OR REPLACE VIEW public.user_profiles_complete AS
SELECT 
    p.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', a.id,
                'type', a.type,
                'address', a.address,
                'district', a.district,
                'province', a.province,
                'postalCode', a.postal_code,
                'country', a.country,
                'is_primary', a.is_primary,
                'created_at', a.created_at,
                'updated_at', a.updated_at
            ) ORDER BY a.is_primary DESC, a.created_at ASC
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::jsonb
    ) as addresses
FROM public.profiles p
LEFT JOIN public.addresses a ON p.id = a.user_id
GROUP BY p.id, p.email, p.full_name, p.avatar_url, p.created_at, 
         p.profile_image, p.personal_phone, p.company_logo, p.company, 
         p.department, p.job_title, p.work_phone, p.work_email, 
         p.website, p.facebook, p.line_id, p.linkedin, p.twitter, 
         p.instagram, p.updated_at;

-- Grant access to the view
GRANT SELECT ON public.user_profiles_complete TO authenticated;

-- Create function to get user profile with addresses
CREATE OR REPLACE FUNCTION public.get_user_profile_with_addresses(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    profile_image TEXT,
    personal_phone TEXT,
    company_logo TEXT,
    company TEXT,
    department TEXT,
    job_title TEXT,
    work_phone TEXT,
    work_email TEXT,
    website TEXT,
    facebook TEXT,
    line_id TEXT,
    linkedin TEXT,
    twitter TEXT,
    instagram TEXT,
    addresses JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.user_profiles_complete 
    WHERE user_profiles_complete.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_profile_with_addresses(UUID) TO authenticated;
