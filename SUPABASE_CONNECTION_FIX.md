# แก้ไขปัญหา Supabase Connection Error

## ปัญหา
```
Failed to load resource: net::ERR_CONNECTION_CLOSED
TypeError: Failed to fetch
AuthRetryableFetchError: Failed to fetch
```

## สาเหตุ
- ไม่มี environment variables สำหรับ Supabase
- Supabase credentials ไม่ถูกต้องหรือไม่ได้ตั้งค่า
- Supabase project อาจจะถูกปิดหรือมีปัญหา

## วิธีแก้ไข

### 1. สร้างไฟล์ `.env.local` ใน `apps/web/`

```bash
# สร้างไฟล์ .env.local
touch apps/web/.env.local
```

### 2. เพิ่ม Supabase credentials ใน `.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration  
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. รับ Supabase credentials

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจคของคุณ (หรือสร้างใหม่)
3. ไปที่ Settings > API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. ตรวจสอบ Supabase Project Status

1. ไปที่ Supabase Dashboard
2. ตรวจสอบว่าโปรเจคยัง Active อยู่
3. ตรวจสอบ Billing (หากเป็น free tier อาจจะถูก pause)

### 5. รัน Migration (หากยังไม่ได้รัน)

```bash
# ไปที่โฟลเดอร์ supabase
cd supabase

# เชื่อมต่อกับ Supabase
supabase link --project-ref your-project-ref

# รัน migrations
supabase db push
```

### 6. รีสตาร์ท Development Server

```bash
# หยุด server (Ctrl+C)
# รันใหม่
npm run dev
```

## การตรวจสอบ

### 1. ตรวจสอบ Console Logs
เปิด Browser DevTools และดู Console ควรเห็น:
```
✅ Using Real Supabase Client
Supabase URL: https://your-project.supabase.co
Supabase Anon Key: Present
```

### 2. ตรวจสอบ Network Tab
ใน Browser DevTools > Network Tab ควรเห็นการเชื่อมต่อไปยัง Supabase URL

### 3. ตรวจสอบ Supabase Dashboard
- ไปที่ Authentication > Users
- ตรวจสอบว่ามี user หรือไม่
- ตรวจสอบ Logs

## หากยังมีปัญหา

### 1. ตรวจสอบ Internet Connection
- ทดสอบเปิด Supabase Dashboard ใน browser
- ตรวจสอบ firewall/proxy settings

### 2. ตรวจสอบ CORS Settings
- ใน Supabase Dashboard > Settings > API
- ตรวจสอบ Allowed Origins

### 3. ลองสร้าง Supabase Project ใหม่
- สร้างโปรเจคใหม่ใน Supabase
- Copy credentials ใหม่
- รัน migrations ใหม่

## Alternative: ใช้ Local Supabase

หากต้องการทดสอบแบบ local:

```bash
# ติดตั้ง Supabase CLI
npm install -g supabase

# เริ่ม local development
supabase start

# ใช้ local credentials ใน .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```
