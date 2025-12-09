# คำแนะนำการ Deploy Edge Functions ไปยัง Supabase

เอกสารนี้จะแนะนำวิธีการ deploy Supabase Edge Functions ที่สร้างไว้ไปยัง Supabase

## 📋 สิ่งที่ต้องเตรียม

1. **Supabase CLI** - ติดตั้ง Supabase CLI
2. **Supabase Project** - มี Supabase project และ Project Reference ID
3. **Authentication** - Login เข้า Supabase CLI

## 🔧 การติดตั้ง Supabase CLI

### Windows
```powershell
npm install -g supabase
```

### macOS/Linux
```bash
npm install -g supabase
# หรือ
brew install supabase/tap/supabase
```

## 🔐 การ Login และ Link Project

### 1. Login เข้า Supabase
```bash
supabase login
```

### 2. Link Project (ถ้ายังไม่ได้ link)
```bash
cd apps/web
supabase link --project-ref <your-project-ref>
```

หรือใช้ environment variable:
```bash
export SUPABASE_PROJECT_REF=your-project-ref
```

## 📦 Edge Functions ที่จะ Deploy

1. **get-profile** - ดึงข้อมูล profile ของ user
2. **update-profile** - อัพเดต profile ของ user
3. **sync-user-metadata** - Sync user metadata จาก addresses
4. **addresses** - จัดการ addresses (GET, POST)
5. **upload-profile** - อัพโหลด profile image
6. **templates** - จัดการ templates (GET, POST, PUT, DELETE, usage)
7. **card-views** - บันทึกการดู card (analytics)
8. **generate-qr** - สร้าง QR code สำหรับ business card
9. **contact** - ส่ง contact form email (public, no auth required)
10. **upload-logo** - อัพโหลด logo และ company logo
11. **delete-account** - ลบ user account (ใช้ admin API)
12. **export-paper-card** - Export business card เป็น PDF/PNG/SVG (placeholder - ยังไม่ได้ implement จริง)

## 🚀 วิธีการ Deploy

### วิธีที่ 1: Deploy ทั้งหมด (แนะนำ)

#### Windows (PowerShell)
```powershell
cd apps/web
.\scripts\deploy-edge-functions.ps1
```

หรือใช้ npm script:
```bash
cd apps/web
npm run deploy:functions
```

#### Linux/macOS (Bash)
```bash
cd apps/web
chmod +x scripts/deploy-edge-functions.sh
./scripts/deploy-edge-functions.sh
```

### วิธีที่ 2: Deploy Function เดียว

#### Windows (PowerShell)
```powershell
cd apps/web
.\scripts\deploy-edge-functions.ps1 -FunctionName "addresses"
```

หรือใช้ npm script:
```bash
cd apps/web
npm run deploy:function addresses
```

#### Linux/macOS (Bash)
```bash
cd apps/web
./scripts/deploy-edge-functions.sh addresses
```

### วิธีที่ 3: ใช้ Supabase CLI โดยตรง

```bash
cd apps/web
supabase functions deploy <function-name> --project-ref <project-ref>
```

ตัวอย่าง:
```bash
supabase functions deploy addresses --project-ref eccyqifrzipzrflkcdkd
```

## 🔍 การตรวจสอบการ Deploy

### 1. ตรวจสอบใน Supabase Dashboard
1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ **Edge Functions** ในเมนูด้านซ้าย
4. ตรวจสอบว่า functions ทั้งหมดถูก deploy แล้ว

### 2. ตรวจสอบ Logs
```bash
supabase functions logs <function-name> --project-ref <project-ref>
```

### 3. ทดสอบ Function
```bash
# ทดสอบ get-profile
curl -X POST https://<project-ref>.supabase.co/functions/v1/get-profile \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## ⚙️ Environment Variables

Edge Functions จะใช้ environment variables จาก Supabase โดยอัตโนมัติ:
- `SUPABASE_URL` - URL ของ Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key สำหรับ admin operations

ไม่ต้องตั้งค่าเอง - Supabase จะ inject ให้อัตโนมัติ

## 🛠️ Troubleshooting

### ปัญหา: Supabase CLI ไม่พบ
```bash
# ตรวจสอบว่า CLI ติดตั้งแล้ว
supabase --version

# ถ้ายังไม่มี ให้ติดตั้งใหม่
npm install -g supabase
```

### ปัญหา: Project ref ไม่ถูกต้อง
```bash
# ตรวจสอบ project ref
supabase projects list

# Link project ใหม่
supabase link --project-ref <correct-project-ref>
```

### ปัญหา: Deploy ล้มเหลว
1. ตรวจสอบว่า function directory มีไฟล์ `index.ts`
2. ตรวจสอบ syntax errors ใน function code
3. ตรวจสอบ logs:
   ```bash
   supabase functions logs <function-name> --project-ref <project-ref>
   ```

### ปัญหา: Function ไม่ทำงาน
1. ตรวจสอบว่า function ถูก deploy แล้วใน Dashboard
2. ตรวจสอบ CORS headers ใน function code
3. ตรวจสอบ authentication - ต้องส่ง access token ใน Authorization header

## 📝 Checklist ก่อน Deploy

- [ ] Supabase CLI ติดตั้งแล้ว
- [ ] Login เข้า Supabase แล้ว (`supabase login`)
- [ ] Link project แล้ว (`supabase link`)
- [ ] ตรวจสอบ function code ไม่มี syntax errors
- [ ] ตรวจสอบว่าใช้ `_shared/auth.ts` และ `_shared/cors.ts` ถูกต้อง
- [ ] ตั้งค่า environment variables (ถ้าจำเป็น)

## 🔄 การ Update Function

เมื่อแก้ไข function code:
1. แก้ไขไฟล์ใน `apps/web/supabase/functions/<function-name>/index.ts`
2. Deploy อีกครั้งด้วย script เดิม
3. Function จะถูก update ทันที (no downtime)

## 📚 เอกสารเพิ่มเติม

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

