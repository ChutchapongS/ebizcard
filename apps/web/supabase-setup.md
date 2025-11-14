# สร้าง Supabase Project ใหม่

## ปัญหาที่พบ
- API Key ไม่ถูกต้อง: `{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}`
- Supabase project อาจถูกปิดใช้งานหรือหมดอายุ

## ขั้นตอนการสร้าง Supabase Project ใหม่

### 1. ไปที่ Supabase Dashboard
- เปิด https://supabase.com/dashboard
- คลิก "New Project"

### 2. ตั้งค่า Project
- **Name**: eBizCard
- **Database Password**: ตั้งรหัสผ่านที่แข็งแกร่ง
- **Region**: Singapore (ap-southeast-1) หรือใกล้ที่สุด
- **Pricing Plan**: Free

### 3. รอให้ Project สร้างเสร็จ
- ใช้เวลาประมาณ 2-3 นาที
- รอจนกว่า Status จะเป็น "Active"

### 4. เก็บข้อมูลสำคัญ
- **Project URL**: `https://[project-id].supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. อัปเดต Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### 6. ตั้งค่า Database Schema
- ไปที่ SQL Editor
- รัน migration script จาก `supabase/migrations/001_initial_schema.sql`

### 7. ตั้งค่า Authentication
- ไปที่ Authentication > Settings
- เปิดใช้งาน Email/Password
- ตั้งค่า OAuth providers (Google, LinkedIn) ตามต้องการ

### 8. ตั้งค่า Row Level Security (RLS)
- ไปที่ Database > Tables
- เปิดใช้งาน RLS สำหรับทุกตาราง
- สร้าง policies ที่เหมาะสม

## หมายเหตุ
- ใช้ Free tier ได้ 500MB database
- มี rate limit 2 requests/second
- Project จะถูกปิดหากไม่ใช้งาน 7 วัน
