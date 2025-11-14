-- Add logo and custom theme fields to business_cards table
ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS company_logo_url TEXT,
ADD COLUMN IF NOT EXISTS custom_theme JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS paper_card_settings JSONB DEFAULT '{}';

-- Add paper card templates table
CREATE TABLE IF NOT EXISTS public.paper_card_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_config JSONB NOT NULL,
    preview_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default paper card templates
INSERT INTO public.paper_card_templates (name, description, template_config, preview_url) VALUES
('Classic', 'Classic business card design', '{"width": 85, "height": 55, "unit": "mm", "background": "#ffffff", "border": "1px solid #e5e7eb", "layout": "horizontal"}', '/templates/classic-preview.png'),
('Modern', 'Modern minimalist design', '{"width": 85, "height": 55, "unit": "mm", "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "border": "none", "layout": "vertical"}', '/templates/modern-preview.png'),
('Corporate', 'Professional corporate design', '{"width": 85, "height": 55, "unit": "mm", "background": "#f8fafc", "border": "2px solid #1e40af", "layout": "horizontal"}', '/templates/corporate-preview.png');

-- Add custom themes table
CREATE TABLE IF NOT EXISTS public.custom_themes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    theme_config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_cards_company_logo_url ON public.business_cards(company_logo_url);
CREATE INDEX IF NOT EXISTS idx_paper_card_templates_is_active ON public.paper_card_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_custom_themes_user_id ON public.custom_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_themes_is_public ON public.custom_themes(is_public);

-- Add RLS policies for new tables
ALTER TABLE public.paper_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_themes ENABLE ROW LEVEL SECURITY;

-- Paper card templates are public
CREATE POLICY "Anyone can view paper card templates" ON public.paper_card_templates
    FOR SELECT USING (true);

-- Custom themes policies
CREATE POLICY "Users can view own custom themes" ON public.custom_themes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public custom themes" ON public.custom_themes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create own custom themes" ON public.custom_themes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom themes" ON public.custom_themes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom themes" ON public.custom_themes
    FOR DELETE USING (auth.uid() = user_id);
