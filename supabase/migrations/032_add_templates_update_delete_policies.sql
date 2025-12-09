-- Add RLS policies for UPDATE and DELETE on templates table
-- This allows users to update/delete their own templates and admin/owner to update/delete system templates

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own templates" ON public.templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.templates;
DROP POLICY IF EXISTS "Admin/Owner can update system templates" ON public.templates;

-- Policy: Users can update their own templates OR admin/owner can update any template
CREATE POLICY "Users can update own templates" ON public.templates
    FOR UPDATE 
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (user_type = 'admin' OR user_type = 'owner')
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (user_type = 'admin' OR user_type = 'owner')
        )
    );

-- Policy: Users can delete their own templates OR admin/owner can delete any template
CREATE POLICY "Users can delete own templates" ON public.templates
    FOR DELETE 
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (user_type = 'admin' OR user_type = 'owner')
        )
    );

