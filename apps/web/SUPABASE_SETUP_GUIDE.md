# 🚀 สร้าง Supabase Project ใหม่ - e-BizCard

## ขั้นตอนที่ 1: สร้าง Supabase Project

### 1.1 ไปที่ Supabase Dashboard
- เปิด https://supabase.com/dashboard
- คลิก **"New Project"**

### 1.2 ตั้งค่า Project
- **Organization**: เลือก organization ของคุณ
- **Name**: `eBizCard`
- **Database Password**: ตั้งรหัสผ่านที่แข็งแกร่ง (เก็บไว้ให้ดี!)
- **Region**: `Singapore (ap-southeast-1)` หรือใกล้ที่สุด
- **Pricing Plan**: `Free`

### 1.3 รอให้ Project สร้างเสร็จ
- ใช้เวลาประมาณ 2-3 นาที
- รอจนกว่า Status จะเป็น **"Active"**

## ขั้นตอนที่ 2: เก็บข้อมูลสำคัญ

### 2.1 ไปที่ Project Settings
- คลิก **Settings** (⚙️) ใน sidebar
- เลือก **API**

### 2.2 คัดลอกข้อมูล
- **Project URL**: `https://[project-id].supabase.co`
- **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (เก็บไว้ให้ดี!)

## ขั้นตอนที่ 3: อัปเดต Environment Variables

### 3.1 แก้ไขไฟล์ `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### 3.2 ตัวอย่าง
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoyMDE1NTc1OTk5fQ.example
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

## ขั้นตอนที่ 4: ตั้งค่า Database Schema

### 4.1 ไปที่ SQL Editor
- คลิก **SQL Editor** ใน sidebar
- คลิก **New Query**

### 4.2 รัน Migration Script
```sql
-- Note: auth.users table is managed by Supabase and already has RLS enabled
-- We only need to create our own tables and enable RLS on them

-- Create business_cards table
CREATE TABLE IF NOT EXISTS business_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  bio TEXT,
  profile_image_url TEXT,
  qr_code_url TEXT,
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on business_cards table
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can insert their own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON business_cards;
DROP POLICY IF EXISTS "Public cards are viewable by everyone" ON business_cards;

CREATE POLICY "Users can view their own cards" ON business_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards" ON business_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON business_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON business_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Create public cards policy
CREATE POLICY "Public cards are viewable by everyone" ON business_cards
  FOR SELECT USING (is_public = true);

-- Create view_tracking table
CREATE TABLE IF NOT EXISTS view_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE,
  viewer_ip INET,
  viewer_user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policy for view_tracking
DROP POLICY IF EXISTS "Anyone can insert view tracking" ON view_tracking;
CREATE POLICY "Anyone can insert view tracking" ON view_tracking
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_public ON business_cards(is_public);
CREATE INDEX IF NOT EXISTS idx_view_tracking_card_id ON view_tracking(card_id);
```

## ขั้นตอนที่ 5: ตั้งค่า Authentication

### 5.1 ไปที่ Authentication Settings
- คลิก **Authentication** ใน sidebar
- เลือก **Settings**

### 5.2 เปิดใช้งาน Email/Password
- **Enable email confirmations**: เปิด (ถ้าต้องการ)
- **Enable email change confirmations**: เปิด (ถ้าต้องการ)

### 5.3 ตั้งค่า OAuth (ถ้าต้องการ)
- **Google**: เปิดใช้งานและตั้งค่า OAuth credentials
- **LinkedIn**: เปิดใช้งานและตั้งค่า OAuth credentials

## ขั้นตอนที่ 6: ตั้งค่า Storage (ถ้าต้องการ)

### 6.1 ไปที่ Storage
- คลิก **Storage** ใน sidebar
- สร้าง bucket ชื่อ `profile-images`

### 6.2 ตั้งค่า RLS สำหรับ Storage
```sql
-- Create storage policies
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'public');
```

## ขั้นตอนที่ 7: ทดสอบการเชื่อมต่อ

### 7.1 รีสตาร์ท Dev Server
```bash
cd apps/web
npm run dev
```

### 7.2 ตรวจสอบ Console
- เปิด Browser Developer Tools
- ดู Console messages
- ควรเห็น: `✅ Using Real Supabase Client`

### 7.3 ทดสอบ Authentication
- ไปที่ `/auth/login`
- ทดสอบ login/signup
- ควรทำงานได้จริง

## หมายเหตุสำคัญ

- **Free Tier**: 500MB database, 2 requests/second
- **Project Pause**: จะถูกปิดหากไม่ใช้งาน 7 วัน
- **API Keys**: เก็บไว้ให้ดี อย่าเปิดเผย
- **Database Password**: เก็บไว้ให้ดี ใช้สำหรับการเข้าถึง database

## หากมีปัญหา

1. ตรวจสอบ API Keys ว่าถูกต้อง
2. ตรวจสอบ Project Status ว่า Active
3. ตรวจสอบ Console errors
4. ตรวจสอบ Network tab ใน Developer Tools
