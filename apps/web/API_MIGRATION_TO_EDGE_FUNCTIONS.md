# รายการ API Routes ที่ต้องย้ายไป Supabase Edge Functions

เอกสารนี้สรุป API routes ทั้งหมดที่ต้องย้ายไปใช้ Supabase Edge Functions เพื่อให้สามารถ deploy บน S3 (static export) ได้

## ✅ API Routes ที่มี Edge Functions อยู่แล้ว

### 1. `/api/get-profile` → `get-profile` Edge Function
- **Status**: ✅ มี Edge Function อยู่แล้ว
- **Location**: `apps/web/supabase/functions/get-profile/index.ts`
- **Action**: เปลี่ยน client code ให้เรียกใช้ Edge Function แทน API route

### 2. `/api/update-profile` → `update-profile` Edge Function  
- **Status**: ✅ มี Edge Function อยู่แล้ว
- **Location**: `apps/web/supabase/functions/update-profile/index.ts`
- **Action**: เปลี่ยน client code ให้เรียกใช้ Edge Function แทน API route

### 3. `/api/sync-user-metadata` → `sync-user-metadata` Edge Function
- **Status**: ✅ มี Edge Function อยู่แล้ว
- **Location**: `apps/web/supabase/functions/sync-user-metadata/index.ts`
- **Action**: เปลี่ยน client code ให้เรียกใช้ Edge Function แทน API route

### 4. `/api/generate-vcard`
- **Status**: ✅ ใช้ Edge Function อยู่แล้ว (proxy ไปที่ `generate-vcard`)
- **Location**: API route เป็น proxy ไปที่ Supabase Edge Function
- **Action**: เปลี่ยน client code ให้เรียกใช้ Edge Function โดยตรง

## ❌ API Routes ที่ยังไม่มี Edge Functions (ต้องสร้าง)

### 1. `/api/supabase-proxy` 
- **Purpose**: Proxy สำหรับ Supabase REST API (GET, POST, PUT, DELETE)
- **Complexity**: ⭐⭐⭐ (สูง - ต้องรองรับหลาย operations)
- **Priority**: 🔴 สูง (ใช้บ่อยมาก)
- **Action**: 
  - สร้าง Edge Function `supabase-proxy`
  - หรือเปลี่ยน client code ให้เรียกใช้ Supabase client โดยตรง (แนะนำ)

### 2. `/api/addresses`
- **Purpose**: GET/POST addresses สำหรับ user
- **Complexity**: ⭐⭐ (ปานกลาง)
- **Priority**: 🔴 สูง
- **Action**: สร้าง Edge Function `addresses`

### 3. `/api/save-address`
- **Purpose**: บันทึก/อัพเดต address เดียว
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟡 ปานกลาง
- **Action**: สร้าง Edge Function `save-address` หรือรวมกับ `addresses`

### 4. `/api/update-addresses`
- **Purpose**: อัพเดต addresses ทั้งหมด (replace strategy)
- **Complexity**: ⭐⭐ (ปานกลาง)
- **Priority**: 🟡 ปานกลาง
- **Action**: รวมกับ Edge Function `addresses` หรือสร้างแยก

### 5. `/api/card-views`
- **Purpose**: บันทึกการดู card (analytics)
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟢 ต่ำ (optional feature)
- **Action**: สร้าง Edge Function `card-views`

### 6. `/api/generate-qr`
- **Purpose**: สร้าง QR code สำหรับ card
- **Complexity**: ⭐⭐ (ปานกลาง - ต้องใช้ library)
- **Priority**: 🟡 ปานกลาง
- **Action**: สร้าง Edge Function `generate-qr` (มี fallback logic อยู่แล้ว)

### 7. `/api/upload-profile`
- **Purpose**: อัพโหลด profile image
- **Complexity**: ⭐⭐⭐ (สูง - ต้องจัดการ file upload)
- **Priority**: 🔴 สูง
- **Action**: สร้าง Edge Function `upload-profile`

### 8. `/api/upload-logo`
- **Purpose**: อัพโหลด logo
- **Complexity**: ⭐⭐⭐ (สูง - ต้องจัดการ file upload)
- **Priority**: 🟡 ปานกลาง
- **Action**: สร้าง Edge Function `upload-logo`

### 9. `/api/upload-company-logo`
- **Purpose**: อัพโหลด company logo
- **Complexity**: ⭐⭐⭐ (สูง - ต้องจัดการ file upload)
- **Priority**: 🟡 ปานกลาง
- **Action**: สร้าง Edge Function `upload-company-logo` หรือรวมกับ `upload-logo`

### 10. `/api/contact`
- **Purpose**: ส่ง contact form email
- **Complexity**: ⭐⭐⭐ (สูง - ต้องใช้ email service)
- **Priority**: 🟢 ต่ำ (optional feature)
- **Action**: สร้าง Edge Function `contact` หรือใช้ Supabase Email service

### 11. `/api/templates`
- **Purpose**: GET/POST templates
- **Complexity**: ⭐⭐ (ปานกลาง)
- **Priority**: 🔴 สูง
- **Action**: สร้าง Edge Function `templates`

### 12. `/api/templates/[id]`
- **Purpose**: GET/PUT/DELETE template by ID
- **Complexity**: ⭐⭐ (ปานกลาง)
- **Priority**: 🟡 ปานกลาง
- **Action**: รวมกับ Edge Function `templates`

### 13. `/api/templates/usage`
- **Purpose**: บันทึก template usage
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟢 ต่ำ (analytics)
- **Action**: สร้าง Edge Function `template-usage`

### 14. `/api/export-paper-card`
- **Purpose**: Export paper card (PDF/image)
- **Complexity**: ⭐⭐⭐⭐ (สูงมาก - ต้องใช้ PDF/image generation)
- **Priority**: 🟡 ปานกลาง
- **Action**: สร้าง Edge Function `export-paper-card`

### 15. `/api/menu-visibility`
- **Purpose**: จัดการ menu visibility settings
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟢 ต่ำ
- **Action**: สร้าง Edge Function `menu-visibility`

### 16. `/api/update-profiles-table`
- **Purpose**: อัพเดต profiles table
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟢 ต่ำ (อาจรวมกับ update-profile)
- **Action**: รวมกับ Edge Function `update-profile`

### 17. `/api/delete-account`
- **Purpose**: ลบ account
- **Complexity**: ⭐⭐⭐ (สูง - ต้องลบข้อมูลหลาย table)
- **Priority**: 🟡 ปานกลาง
- **Action**: สร้าง Edge Function `delete-account`

### 18. `/api/setup-storage`
- **Purpose**: Setup storage buckets
- **Complexity**: ⭐⭐ (ปานกลาง)
- **Priority**: 🟢 ต่ำ (admin only, one-time setup)
- **Action**: สร้าง Edge Function `setup-storage` หรือทำ manual

### 19. `/api/test-storage` และ `/api/test-storage-admin`
- **Purpose**: Test storage functionality
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟢 ต่ำ (debug only)
- **Action**: ลบออกหรือย้ายไปเป็น admin tool

### 20. `/api/test` และ `/api/test-profile`
- **Purpose**: Test endpoints
- **Complexity**: ⭐ (ต่ำ)
- **Priority**: 🟢 ต่ำ (debug only)
- **Action**: ลบออก

### 21. `/api/auth/scgjwd-token`
- **Purpose**: SCG JWD token authentication
- **Complexity**: ⭐⭐⭐ (สูง - custom auth flow)
- **Priority**: 🟡 ปานกลาง (เฉพาะ SCG JWD)
- **Action**: สร้าง Edge Function `scgjwd-token` หรือใช้ Supabase Auth

### 22. Admin Routes (`/api/admin/*`)
- **Purpose**: Admin operations
- **Complexity**: ⭐⭐-⭐⭐⭐ (ปานกลาง-สูง)
- **Priority**: 🟡 ปานกลาง (admin only)
- **Routes**:
  - `/api/admin/web-settings`
  - `/api/admin/update-user-type`
  - `/api/admin/level-capabilities`
  - `/api/admin/menu-visibility`
  - `/api/admin/upload-website-logo`
  - `/api/admin/upload-slide-image`
  - `/api/admin/upload-feature-icon`
- **Action**: สร้าง Edge Functions สำหรับ admin operations

## 📊 สรุป

### สถิติ
- **Total API Routes**: 32 routes
- **มี Edge Functions แล้ว**: 4 routes (12.5%)
- **ต้องสร้าง Edge Functions**: 28 routes (87.5%)

### Priority Breakdown
- **🔴 สูง (ต้องทำก่อน)**: 6 routes
  - supabase-proxy (หรือใช้ client โดยตรง)
  - addresses
  - upload-profile
  - templates
  - get-profile (เปลี่ยน client code)
  - update-profile (เปลี่ยน client code)

- **🟡 ปานกลาง**: 10 routes
- **🟢 ต่ำ (optional/debug)**: 12 routes

## 🚀 แผนการ Migration

### Phase 1: Critical Routes (ทำก่อน)
1. เปลี่ยน client code ให้ใช้ Edge Functions ที่มีอยู่แล้ว:
   - `get-profile`
   - `update-profile`
   - `sync-user-metadata`
   - `generate-vcard`

2. สร้าง Edge Functions สำหรับ:
   - `addresses` (รวม save-address, update-addresses)
   - `upload-profile`
   - `templates` (รวม templates/[id], templates/usage)

3. แก้ไข `supabase-proxy`:
   - เปลี่ยน client code ให้ใช้ Supabase client โดยตรง (แนะนำ)
   - หรือสร้าง Edge Function `supabase-proxy`

### Phase 2: Important Routes
4. สร้าง Edge Functions สำหรับ:
   - `generate-qr`
   - `card-views`
   - `upload-logo` (รวม upload-company-logo)
   - `contact`

### Phase 3: แก้ไข supabase-proxy ✅
3. แก้ไข `supabase-proxy`:
   - เปลี่ยน client code ให้ใช้ Supabase client โดยตรง (แนะนำ) ✅
   - หรือสร้าง Edge Function `supabase-proxy`

### Phase 4: Admin & Optional Routes ✅
5. ✅ ลบ debug/test routes:
   - `/api/test` - ลบแล้ว
   - `/api/test-storage` - ลบแล้ว
   - `/api/test-storage-admin` - ลบแล้ว
6. ⏳ สร้าง Edge Functions สำหรับ admin operations (optional - ใช้บ่อยแต่ไม่ critical)
7. ⏳ สร้าง optional features (export-paper-card, delete-account) - ถ้าจำเป็น

## 💡 คำแนะนำ

### 1. ใช้ Supabase Client โดยตรง (แทน supabase-proxy)
- **ข้อดี**: ไม่ต้องสร้าง Edge Function, ใช้ RLS policies ได้
- **ข้อเสีย**: ต้อง expose anon key ใน client (ปกติทำอยู่แล้ว)

### 2. รวม Related Routes
- `addresses`, `save-address`, `update-addresses` → `addresses` function
- `templates`, `templates/[id]`, `templates/usage` → `templates` function
- `upload-logo`, `upload-company-logo` → `upload-logo` function

### 3. ลบ Debug/Test Routes ✅
- `/api/test*` - ลบแล้ว
- `/api/test-storage*` - ลบแล้ว
- ย้ายไปเป็น admin tools หรือลบออก

### 4. ใช้ Supabase Storage Direct Upload
- สำหรับ file uploads, ใช้ Supabase Storage signed URLs
- ลดความจำเป็นในการสร้าง upload Edge Functions

## 📝 Next Steps

1. **เริ่มจาก Phase 1**: เปลี่ยน client code ให้ใช้ Edge Functions ที่มีอยู่แล้ว
2. **สร้าง Critical Edge Functions**: addresses, upload-profile, templates
3. **ทดสอบ**: ตรวจสอบว่า static export ทำงานได้
4. **Deploy**: Deploy ไปยัง S3
5. **Phase 2 & 3**: ทำต่อตาม priority

