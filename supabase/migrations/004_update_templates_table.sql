-- Update templates table to support user-specific templates
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS paper_settings JSONB,
ADD COLUMN IF NOT EXISTS elements JSONB,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

-- Update existing templates to have default values
UPDATE public.templates 
SET paper_settings = '{"size": "Business Card", "width": 90, "height": 55, "orientation": "portrait", "background": {"type": "color", "color": "#ffffff"}}'::jsonb,
    elements = '[]'::jsonb
WHERE paper_settings IS NULL;

-- Add trigger for updated_at
CREATE TRIGGER set_templates_updated_at 
BEFORE UPDATE ON public.templates 
FOR EACH ROW 
EXECUTE FUNCTION handle_updated_at();
