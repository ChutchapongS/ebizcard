# Supabase Edge Functions Setup

## วิธีแก้ปัญหา CORS ด้วย Edge Functions

### 1. ติดตั้ง Supabase CLI

```bash
npm install -g supabase
```

### 2. Login เข้า Supabase

```bash
supabase login
```

### 3. Link Project

```bash
cd apps/web
supabase link --project-ref eccyqifrzipzrflkcdkd
```

### 4. Deploy Edge Functions

```bash
# ใช้ script ที่สร้างไว้
chmod +x scripts/deploy-functions.sh
./scripts/deploy-functions.sh

# หรือ deploy โดยตรง
supabase functions deploy update-profile --project-ref eccyqifrzipzrflkcdkd
```

### 5. ตั้งค่า Environment Variables

ใน Supabase Dashboard > Settings > Edge Functions:

```
SUPABASE_URL=https://eccyqifrzipzrflkcdkd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 6. ทดสอบ

1. เปิด `http://localhost:3000/settings`
2. แก้ไขข้อมูลในแท็บ "ข้อมูลส่วนตัว"
3. คลิก "บันทึกการเปลี่ยนแปลง"
4. ตรวจสอบว่าไม่มี CORS error

## ไฟล์ที่เกี่ยวข้อง

- `supabase/functions/update-profile/index.ts` - Edge Function สำหรับ update profile
- `supabase/functions/_shared/cors.ts` - CORS headers
- `src/lib/auth-context.tsx` - ใช้ Edge Function แทน direct API call

## ข้อดีของ Edge Functions

1. **ไม่มีปัญหา CORS** - รันบน Supabase servers
2. **ใช้ Service Role Key** - มีสิทธิ์เต็มในการอัปเดต user data
3. **ปลอดภัย** - ตรวจสอบ access token ก่อนดำเนินการ
4. **เร็ว** - รันใกล้กับ database
