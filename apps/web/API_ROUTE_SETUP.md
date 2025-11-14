# API Route Setup สำหรับแก้ปัญหา CORS

## วิธีแก้ไขปัญหา CORS ด้วย Next.js API Route

### 1. ตั้งค่า Environment Variables

เพิ่มในไฟล์ `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://eccyqifrzipzrflkcdkd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Service Role Key (สำหรับ admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. วิธีหา Service Role Key

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจค `eccyqifrzipzrflkcdkd`
3. ไปที่ **Settings** → **API**
4. คัดลอก **service_role** key (ไม่ใช่ anon key)

### 3. ไฟล์ที่เกี่ยวข้อง

- `src/app/api/update-profile/route.ts` - API route สำหรับ update profile
- `src/lib/auth-context.tsx` - ใช้ API route แทน direct API call

### 4. วิธีทำงาน

1. **Frontend** ส่ง access token ไปยัง `/api/update-profile`
2. **API Route** ใช้ service role key เพื่ออัปเดต user data
3. **ไม่มีปัญหา CORS** - เพราะเป็น server-to-server communication

### 5. ทดสอบ

1. เปิด `http://localhost:3000/settings`
2. แก้ไขข้อมูลในแท็บ "ข้อมูลส่วนตัว"
3. คลิก "บันทึกการเปลี่ยนแปลง"
4. ตรวจสอบว่าไม่มี CORS error

## ข้อดีของวิธีนี้

- ✅ ไม่ต้องติดตั้ง Supabase CLI
- ✅ ใช้ Next.js API Route ที่มีอยู่แล้ว
- ✅ ไม่มีปัญหา CORS
- ✅ ปลอดภัย (ตรวจสอบ access token)
- ✅ ง่ายต่อการ deploy
