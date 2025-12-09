# สถานะความพร้อม Deploy ไปยัง S3

**วันที่ตรวจสอบ:** 2025-01-24  
**สถานะ:** ✅ **พร้อม Deploy** (Edge Functions ทั้งหมดสร้างเสร็จแล้ว)

---

## ✅ สิ่งที่พร้อมแล้ว

### 1. **Code Migration**
- ✅ แก้ไขโค้ดทั้งหมดให้ใช้ Edge Functions แทน Next.js API routes แล้ว
- ✅ ไม่มี `fetch('/api/...')` ใน client code (เหลือเฉพาะ API route handlers เอง)
- ✅ Syntax errors แก้ไขแล้ว
- ✅ TypeScript และ Linter ผ่าน

### 2. **Next.js Static Export Configuration**
- ✅ `next.config.js` รองรับ static export (`NEXT_STATIC_EXPORT=true`)
- ✅ Images configuration สำหรับ static export (unoptimized: true)
- ✅ Middleware จัดการ static export mode
- ✅ Dynamic routes ใช้ client-side routing

### 3. **Build Scripts**
- ✅ `npm run build:s3` สำหรับ build static export
- ✅ Scripts สำหรับ deploy ไปยัง S3 (PowerShell และ Bash)
- ✅ S3 configuration files (CORS, Bucket Policy)

### 4. **Edge Functions ที่มีอยู่**
- ✅ `addresses` - จัดการที่อยู่
- ✅ `card-views` - ติดตามการดูนามบัตร
- ✅ `contact` - ฟอร์มติดต่อ
- ✅ `delete-account` - ลบบัญชี
- ✅ `export-paper-card` - ส่งออกนามบัตร
- ✅ `generate-qr` - สร้าง QR Code
- ✅ `get-profile` - ดึงข้อมูลโปรไฟล์
- ✅ `sync-user-metadata` - ซิงค์ user metadata
- ✅ `templates` - จัดการ templates
- ✅ `update-profile` - อัปเดตโปรไฟล์
- ✅ `upload-logo` - อัปโหลดโลโก้
- ✅ `upload-profile` - อัปโหลดรูปโปรไฟล์
- ✅ `user-portal-login` - เข้าสู่ระบบผ่าน User Portal

---

### 5. **Edge Functions สำหรับ Admin** (สร้างเสร็จแล้ว)
- ✅ `web-settings` - GET/POST web settings
- ✅ `level-capabilities` - GET/POST level capabilities
- ✅ `menu-visibility` - GET/POST menu visibility settings
- ✅ `update-user-type` - GET users / POST update user type
- ✅ `upload-website-logo` - POST upload website logo
- ✅ `upload-slide-image` - POST upload slide image
- ✅ `upload-feature-icon` - POST upload feature icon

---

## 📋 Checklist ก่อน Deploy

### Code & Build
- [x] แก้ไข API calls ทั้งหมดให้ใช้ Edge Functions
- [x] แก้ไข syntax errors
- [x] TypeScript type checking ผ่าน
- [x] Linter ผ่าน
- [ ] ทดสอบ build: `npm run build:s3`
- [ ] ทดสอบ static export locally

### Edge Functions
- [x] Edge Functions หลักถูก deploy แล้ว
- [x] สร้าง `web-settings` เสร็จแล้ว (ต้อง deploy)
- [x] สร้าง `level-capabilities` เสร็จแล้ว (ต้อง deploy)
- [x] สร้าง `menu-visibility` เสร็จแล้ว (ต้อง deploy)
- [x] สร้าง `update-user-type` เสร็จแล้ว (ต้อง deploy)
- [x] สร้าง `upload-website-logo` เสร็จแล้ว (ต้อง deploy)
- [x] สร้าง `upload-slide-image` เสร็จแล้ว (ต้อง deploy)
- [x] สร้าง `upload-feature-icon` เสร็จแล้ว (ต้อง deploy)

### Environment Variables
- [ ] ตรวจสอบ `NEXT_PUBLIC_SUPABASE_URL` ตั้งค่าแล้ว
- [ ] ตรวจสอบ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ตั้งค่าแล้ว
- [ ] ตั้งค่า `NEXT_PUBLIC_SITE_URL` เป็น production URL

### S3 Setup
- [ ] สร้าง S3 bucket
- [ ] ตั้งค่า Bucket Policy (public read)
- [ ] ตั้งค่า CORS
- [ ] เปิดใช้งาน Static Website Hosting
- [ ] (แนะนำ) ตั้งค่า CloudFront

---

## 🚀 ขั้นตอนการ Deploy

### Step 1: Deploy Edge Functions

Edge Functions ทั้งหมดสร้างเสร็จแล้ว ต้อง deploy:

### Step 2: Deploy Edge Functions

```bash
cd apps/web
supabase functions deploy web-settings
supabase functions deploy level-capabilities
supabase functions deploy menu-visibility
supabase functions deploy update-user-type
supabase functions deploy upload-website-logo
supabase functions deploy upload-slide-image
supabase functions deploy upload-feature-icon
```

### Step 3: ทดสอบ Build

```bash
cd apps/web
npm run build:s3
```

ตรวจสอบว่า:
- Build สำเร็จ
- ไม่มี errors
- โฟลเดอร์ `out/` ถูกสร้าง

### Step 4: ทดสอบ Local Static Export

```bash
# Serve static files locally
npx serve out
```

### Step 5: Deploy ไปยัง S3

```powershell
# Windows
cd apps/web
.\scripts\deploy-s3.ps1 -BucketName "your-bucket-name" -Region "ap-southeast-1"
```

```bash
# Linux/macOS
cd apps/web
chmod +x scripts/deploy-s3.sh
./scripts/deploy-s3.sh your-bucket-name ap-southeast-1
```

---

## 📊 สรุปสถานะ

### ✅ พร้อมแล้ว
- Code migration เสร็จสมบูรณ์
- Syntax errors แก้ไขแล้ว
- TypeScript และ Linter ผ่าน
- Build configuration พร้อม
- Edge Functions หลักมีอยู่แล้ว

### ⚠️ ต้องทำก่อน Deploy
- Deploy Edge Functions ทั้งหมด (7 functions)
- ทดสอบ build: `npm run build:s3`
- ตั้งค่า S3 bucket และ CloudFront

### ⏱️ เวลาโดยประมาณ
- Deploy Edge Functions: 30 นาที - 1 ชั่วโมง
- ทดสอบ build: 15-30 นาที
- ตั้งค่า S3 และ CloudFront: 1-2 ชั่วโมง
- **รวม: 2-4 ชั่วโมง**

---

## 📝 หมายเหตุ

1. **API Routes ที่เหลือ**: `apps/web/src/app/api/*` ยังคงอยู่ แต่เป็น route handlers เอง ไม่ใช่ client code ที่เรียกใช้ จึงไม่กระทบ static export

2. **Dynamic Routes**: `apps/web/src/app/card/[id]/page.tsx` ใช้ client-side routing ซึ่งทำงานได้ดีกับ static export

3. **Environment Variables**: ต้องตั้งค่า `NEXT_PUBLIC_*` variables ให้ถูกต้องก่อน build

4. **Edge Functions**: ต้อง deploy Edge Functions ทั้งหมดก่อน deploy static site

---

## 🔗 เอกสารอ้างอิง

- `apps/web/S3_DEPLOYMENT.md` - คำแนะนำการ deploy
- `apps/web/src/lib/api-client.ts` - API client สำหรับ Edge Functions
- `apps/web/next.config.js` - Next.js configuration

