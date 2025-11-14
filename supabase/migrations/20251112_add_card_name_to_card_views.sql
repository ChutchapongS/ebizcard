ALTER TABLE public.card_views
ADD COLUMN IF NOT EXISTS card_name text;

CREATE INDEX IF NOT EXISTS idx_card_views_card_name ON public.card_views (card_name);


