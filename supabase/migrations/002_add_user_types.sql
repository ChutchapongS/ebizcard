-- Add user_type column to profiles table with more granular roles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'user' CHECK (user_type IN ('owner', 'admin', 'user'));

-- Add role management columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_permissions JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_by ON profiles(assigned_by);

-- Set existing users as 'user' by default
UPDATE profiles SET user_type = 'user' WHERE user_type IS NULL;

-- Create role management audit table
CREATE TABLE IF NOT EXISTS role_changes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_role TEXT,
    new_role TEXT NOT NULL,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_changes_user_id ON role_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_changed_by ON role_changes(changed_by);
CREATE INDEX IF NOT EXISTS idx_role_changes_created_at ON role_changes(created_at);

-- RLS Policies for role management
ALTER TABLE role_changes ENABLE ROW LEVEL SECURITY;

-- Only admins and owners can view role changes
CREATE POLICY "Users can view their own role changes" ON role_changes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and owners can view all role changes" ON role_changes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'owner')
        )
    );

-- Only admins and owners can insert role changes
CREATE POLICY "Admins and owners can insert role changes" ON role_changes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('admin', 'owner')
        )
    );

-- Function to set owner (run this manually for the first owner)
-- UPDATE profiles SET user_type = 'owner' WHERE email = 'your-email@example.com';
