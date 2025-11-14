-- Create contact_leads table to track external visitors who interact with a card
CREATE TABLE IF NOT EXISTS public.contact_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT DEFAULT 'vcard_download',
    note TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_leads_owner_id ON public.contact_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_contact_leads_card_id ON public.contact_leads(card_id);

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their contact leads" ON public.contact_leads
    FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can manage their contact leads" ON public.contact_leads
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can remove their contact leads" ON public.contact_leads
    FOR DELETE
    USING (auth.uid() = owner_id);

