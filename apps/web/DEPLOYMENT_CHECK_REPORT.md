# รายงานการตรวจสอบความพร้อม Deploy ไปยัง S3

**วันที่ตรวจสอบ:** $(date)  
**สถานะ:** ⚠️ **ยังไม่พร้อม - ต้องแก้ไขก่อน deploy**

---

## ✅ สิ่งที่พร้อมแล้ว

1. **Next.js Static Export Configuration**
   - ✅ `next.config.js` รองรับ static export (`NEXT_STATIC_EXPORT=true`)
   - ✅ Images configuration สำหรับ static export (unoptimized: true)
   - ✅ Middleware จัดการ static export mode

2. **Build Scripts**
   - ✅ `npm run build:s3` สำหรับ build static export
   - ✅ Scripts สำหรับ deploy ไปยัง S3 (PowerShell และ Bash)
   - ✅ S3 configuration files (CORS, Bucket Policy)

3. **TypeScript & Code Quality**
   - ✅ Type checking ผ่าน (ไม่มี errors)
   - ✅ Linter ผ่าน (ไม่มี errors)

4. **Edge Functions Infrastructure**
   - ✅ `api-client.ts` ใช้ Supabase Edge Functions
   - ✅ มี Edge Functions สำหรับ API endpoints หลัก

---

## ❌ ปัญหาที่ต้องแก้ไข

### 1. **ยังมีการเรียก Next.js API Routes โดยตรง** (Critical)

พบโค้ดที่ยังเรียก `/api/` โดยตรงแทนการใช้ Edge Functions ผ่าน `api-client.ts`:

**ไฟล์ที่ต้องแก้ไข:**

1. **`apps/web/src/app/contact/page.tsx`**
   - Line 26: `fetch('/api/admin/web-settings')`

2. **`apps/web/src/app/theme-customization/page.tsx`**
   - Line 271: `fetch('/api/admin/level-capabilities')`
   - Line 303: `fetch('/api/templates')`
   - Line 335: `fetch('/api/templates/usage')`
   - Line 1419: `fetch('/api/templates')`

3. **`apps/web/src/app/card-editor/page.tsx`**
   - Line 252: `fetch('/api/admin/level-capabilities')`
   - Line 367: `fetch('/api/templates')`

4. **`apps/web/src/components/dashboard/DashboardContent.tsx`**
   - Line 670: `fetch('/api/generate-qr')`
   - Line 865: `fetch('/api/generate-qr')`

5. **`apps/web/src/components/layout/Navbar.tsx`**
   - Line 57: `fetch('/api/admin/web-settings')`
   - Line 149: `fetch('/api/admin/web-settings')`
   - Line 180: `fetch('/api/menu-visibility')`

6. **`apps/web/src/app/auth/login/page.tsx`**
   - Line 36: `fetch('/api/admin/web-settings')`

7. **`apps/web/src/components/landing/SliderShowcase.tsx`**
   - Line 48: `fetch('/api/admin/web-settings')`

8. **`apps/web/src/components/landing/Features.tsx`**
   - Line 68: `fetch('/api/admin/web-settings')`

9. **`apps/web/src/app/debug/page.tsx`**
   - Line 147: `fetch('/api/supabase-proxy')`
   - Line 202: `fetch('/api/supabase-proxy')`

10. **`apps/web/src/app/admin/users/page.tsx`**
    - Line 62: `fetch('/api/admin/update-user-type')`
    - Line 87: `fetch('/api/admin/update-user-type')`

11. **`apps/web/src/components/card/DemoCardView.tsx`**
    - Line 53: `fetch('/api/generate-qr')`

12. **`apps/web/src/app/auth/register/page.tsx`**
    - Line 37: `fetch('/api/admin/web-settings')`
    - Line 333: `fetch('/api/admin/web-settings')`
    - Line 359: `fetch('/api/admin/web-settings')`

13. **`apps/web/src/components/admin/WebSettingsTab.tsx`**
    - Line 286: `fetch('/api/admin/web-settings')`
    - Line 481: `fetch('/api/admin/upload-website-logo')`
    - Line 509: `fetch('/api/admin/upload-slide-image')`
    - Line 545: `fetch('/api/admin/upload-feature-icon')`
    - Line 600: `fetch('/api/admin/web-settings')`

14. **`apps/web/src/components/landing/Footer.tsx`**
    - Line 51: `fetch('/api/admin/web-settings')`
    - Line 211: `fetch('/api/admin/web-settings')`
    - Line 237: `fetch('/api/admin/web-settings')`

15. **`apps/web/src/components/admin/UserManagementTab.tsx`**
    - Line 66: `fetch('/api/admin/update-user-type')`
    - Line 104: `fetch('/api/admin/update-user-type')`

16. **`apps/web/src/components/admin/MenuVisibilityTab.tsx`**
    - Line 64: `fetch('/api/admin/menu-visibility')`
    - Line 97: `fetch('/api/admin/menu-visibility')`

17. **`apps/web/src/components/admin/LevelCapabilityTab.tsx`**
    - Line 82: `fetch('/api/admin/level-capabilities')`
    - Line 115: `fetch('/api/admin/level-capabilities')`

**วิธีแก้ไข:**
- แทนที่ `fetch('/api/...')` ด้วย functions จาก `@/lib/api-client`
- ตรวจสอบว่า Edge Functions ที่เกี่ยวข้องถูก deploy แล้ว

---

### 2. **Dynamic Routes ไม่มี generateStaticParams**

**`apps/web/src/app/card/[id]/page.tsx`**
- ใช้ dynamic route `[id]` แต่ไม่มี `generateStaticParams`
- สำหรับ static export ต้องใช้ client-side routing หรือ generate static paths

**วิธีแก้ไข:**
- ใช้ client-side routing (ปัจจุบันใช้อยู่แล้ว ✅)
- หรือเพิ่ม `generateStaticParams` ถ้าต้องการ pre-render cards ที่มีอยู่

---

### 3. **Environment Variables**

ตรวจสอบว่า environment variables ถูกตั้งค่าแล้ว:
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (จำเป็น)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (จำเป็น)
- `NEXT_PUBLIC_SITE_URL` ⚠️ (ควรตั้งค่าเป็น production URL)

---

## 📋 ขั้นตอนการแก้ไข

### Step 1: แก้ไข API Calls
1. ตรวจสอบว่า Edge Functions ถูก deploy แล้ว:
   - `get-profile`
   - `update-profile`
   - `templates`
   - `generate-qr`
   - `admin/web-settings` (หรือใช้ Edge Function)
   - `admin/level-capabilities`
   - `admin/menu-visibility`
   - `admin/update-user-type`
   - `admin/upload-*`

2. แก้ไขโค้ดให้ใช้ `api-client.ts` แทน direct API calls

### Step 2: ทดสอบ Build
```bash
cd apps/web
npm run build:s3
```

ตรวจสอบว่า:
- Build สำเร็จ
- ไม่มี errors
- โฟลเดอร์ `out/` ถูกสร้าง

### Step 3: ทดสอบ Local Static Export
```bash
# Serve static files locally
npx serve out
```

### Step 4: Deploy ไปยัง S3
```powershell
# Windows
.\scripts\deploy-s3.ps1 -BucketName "your-bucket-name" -Region "ap-southeast-1"
```

---

## 🔍 Edge Functions ที่ต้องมี

ตรวจสอบว่า Edge Functions ต่อไปนี้ถูก deploy แล้ว:

- ✅ `get-profile`
- ✅ `update-profile`
- ✅ `templates`
- ✅ `generate-qr`
- ✅ `contact`
- ✅ `card-views`
- ⚠️ `admin/web-settings` (อาจต้องสร้าง)
- ⚠️ `admin/level-capabilities` (อาจต้องสร้าง)
- ⚠️ `admin/menu-visibility` (อาจต้องสร้าง)
- ⚠️ `admin/update-user-type` (อาจต้องสร้าง)
- ⚠️ `admin/upload-*` (อาจต้องสร้าง)

---

## ✅ Checklist ก่อน Deploy

- [ ] แก้ไข API calls ทั้งหมดให้ใช้ Edge Functions
- [ ] ทดสอบ build: `npm run build:s3`
- [ ] ทดสอบ static export locally
- [ ] ตรวจสอบ environment variables
- [ ] Deploy Edge Functions ที่จำเป็น
- [ ] ตั้งค่า S3 bucket
- [ ] ตั้งค่า CloudFront (แนะนำ)
- [ ] ทดสอบ production URL

---

## 📚 เอกสารอ้างอิง

- `apps/web/S3_DEPLOYMENT.md` - คำแนะนำการ deploy
- `apps/web/src/lib/api-client.ts` - API client สำหรับ Edge Functions
- `apps/web/next.config.js` - Next.js configuration

---

## สรุป

**สถานะ:** ⚠️ **ยังไม่พร้อม**

**ปัญหาหลัก:** ยังมีการเรียก Next.js API routes โดยตรง 38 จุด ซึ่งจะไม่ทำงานเมื่อ deploy เป็น static export

**การแก้ไข:** ต้องแก้ไขโค้ดให้ใช้ Edge Functions ผ่าน `api-client.ts` ทั้งหมด

**เวลาโดยประมาณ:** 2-4 ชั่วโมง (ขึ้นอยู่กับจำนวน Edge Functions ที่ต้องสร้าง)

