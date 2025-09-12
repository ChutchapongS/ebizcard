-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_cards table
CREATE TABLE IF NOT EXISTS public.business_cards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    social_links JSONB DEFAULT '{}',
    theme TEXT DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT NOT NULL,
    preview_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.business_cards(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, visitor_id, card_id)
);

-- Create card_views table
CREATE TABLE IF NOT EXISTS public.card_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    card_id UUID REFERENCES public.business_cards(id) ON DELETE CASCADE NOT NULL,
    viewer_ip TEXT NOT NULL,
    device_info TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON public.business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_created_at ON public.business_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_visitor_id ON public.contacts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_card_views_card_id ON public.card_views(card_id);
CREATE INDEX IF NOT EXISTS idx_card_views_created_at ON public.card_views(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for business_cards updated_at
CREATE TRIGGER set_business_cards_updated_at
    BEFORE UPDATE ON public.business_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for business_cards
CREATE POLICY "Users can view own business cards" ON public.business_cards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business cards" ON public.business_cards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business cards" ON public.business_cards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own business cards" ON public.business_cards
    FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access to business cards for public pages
CREATE POLICY "Public can view business cards" ON public.business_cards
    FOR SELECT USING (true);

-- Create RLS policies for templates
CREATE POLICY "Anyone can view templates" ON public.templates
    FOR SELECT USING (true);

-- Create RLS policies for contacts
CREATE POLICY "Users can view own contacts" ON public.contacts
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert contacts" ON public.contacts
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Create RLS policies for card_views
CREATE POLICY "Anyone can insert card views" ON public.card_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Card owners can view their card views" ON public.card_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.business_cards 
            WHERE id = card_views.card_id 
            AND user_id = auth.uid()
        )
    );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
