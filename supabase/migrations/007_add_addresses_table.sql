-- Create addresses table to store user addresses separately
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'other')),
    place TEXT, -- สถานที่ เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด
    address TEXT NOT NULL, -- ที่อยู่
    tambon TEXT NOT NULL, -- ตำบล/แขวง
    district TEXT NOT NULL, -- อำเภอ/เขต
    province TEXT NOT NULL, -- จังหวัด
    postal_code TEXT, -- รหัสไปรษณีย์
    country TEXT DEFAULT 'Thailand', -- ประเทศ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_addresses_updated_at 
    BEFORE UPDATE ON public.addresses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own addresses
CREATE POLICY "Users can manage their own addresses" ON public.addresses
    FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON public.addresses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
