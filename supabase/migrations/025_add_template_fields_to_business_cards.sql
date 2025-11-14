-- Add template-related fields to business_cards table
ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS field_values JSONB DEFAULT '{}';

-- Create index for template_id for better performance
CREATE INDEX IF NOT EXISTS idx_business_cards_template_id ON public.business_cards(template_id);

-- Add comment to explain the new fields
COMMENT ON COLUMN public.business_cards.template_id IS 'Reference to the template used for this business card';
COMMENT ON COLUMN public.business_cards.field_values IS 'Field values from template with user input content';
