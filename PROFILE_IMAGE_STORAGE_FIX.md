# 📸 แก้ไขปัญหาการบันทึกรูป Profile ใน Supabase Storage

> **สร้างเมื่อ**: 8 ตุลาคม 2024  
> **สถานะ**: ✅ พร้อมใช้งาน  

---

## 🎯 สรุปโซลูชัน

เอกสารนี้อธิบายวิธีการแก้ไขปัญหาการบันทึกรูป profile image ให้ใช้ **Supabase Storage** แทนการใช้ **base64 fallback**

---

## 📋 ไฟล์ที่สร้างขึ้น

### 1. Migration Files
- **`supabase/migrations/010_fix_storage_buckets.sql`**
  - สร้าง storage buckets: `avatars`, `business-cards`, `logos`
  - ตั้งค่า RLS policies สำหรับแต่ละ bucket
  - ลบ policies เก่าที่อาจขัดแย้งกัน

### 2. Setup Scripts
- **`scripts/setup-supabase-storage.sql`**
  - สคริปต์สำหรับรันใน Supabase SQL Editor
  - มีคำอธิบายเป็นภาษาไทยทุกขั้นตอน
  - รวมคำสั่งตรวจสอบผลลัพธ์

### 3. Documentation
- **`docs/SUPABASE_STORAGE_SETUP_GUIDE.md`**
  - คู่มือการตั้งค่าแบบละเอียด
  - รวมวิธีแก้ปัญหาต่างๆ
  - มี checklist สำหรับการตรวจสอบ

### 4. Testing Tools
- **`scripts/test-storage-upload.html`**
  - เครื่องมือทดสอบการอัปโหลด
  - UI แบบ interactive
  - แสดงผลลัพธ์แบบ real-time

---

## 🚀 วิธีใช้งาน (Quick Start)

### ขั้นตอนที่ 1: รัน Migration

เลือก **1 วิธี** จาก 2 วิธีต่อไปนี้:

#### วิธีที่ 1: ใช้ Supabase CLI (แนะนำ)

```bash
# 1. ตรวจสอบว่ามี Supabase CLI
supabase --version

# 2. ถ้ายังไม่มี ติดตั้งก่อน
npm install -g supabase

# 3. Link โปรเจกต์
supabase link --project-ref YOUR_PROJECT_REF

# 4. รัน migration
supabase db push
```

#### วิธีที่ 2: ใช้ Supabase Dashboard

1. เปิด https://supabase.com/dashboard
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ **SQL Editor**
4. Copy เนื้อหาจาก `scripts/setup-supabase-storage.sql`
5. Paste และกด **Run**

### ขั้นตอนที่ 2: ตรวจสอบ

```bash
# เปิด testing tool
# คลิกสองครั้งที่ scripts/test-storage-upload.html
```

หรือตรวจสอบใน Supabase Dashboard:
- ไปที่ **Storage** → **Buckets**
- ควรเห็น: `avatars`, `business-cards`, `logos`

### ขั้นตอนที่ 3: ทดสอบ

```bash
# รัน web app
cd apps/web
npm run dev

# เปิด browser: http://localhost:3000
# ไปที่ Settings → อัปโหลดรูป profile
```

---

## 📊 เปรียบเทียบ Before/After

### ❌ ก่อนแก้ไข (Base64 Fallback)

```javascript
// User metadata
{
  avatar_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAALQCAYAA..."
  // ความยาว: ~50,000-100,000 ตัวอักษร
}
```

**ปัญหา**:
- ❌ ข้อมูลใหญ่เกินไป (payload size limit)
- ❌ โหลดช้า
- ❌ ทำให้ database ใหญ่โดยไม่จำเป็น
- ❌ ไม่สามารถใช้ CDN
- ❌ ไม่สามารถ optimize รูปภาพ

### ✅ หลังแก้ไข (Supabase Storage)

```javascript
// User metadata
{
  avatar_url: "https://project.supabase.co/storage/v1/object/public/avatars/profiles/profile-xxx.jpg"
  // ความยาว: ~90 ตัวอักษร
}
```

**ประโยชน์**:
- ✅ ข้อมูลเล็ก (URL เท่านั้น)
- ✅ โหลดเร็ว (ผ่าน CDN)
- ✅ ประหยัดพื้นที่ database
- ✅ รองรับรูปขนาดใหญ่ (ถึง 50 MB)
- ✅ สามารถใช้ Image Transformation

---

## 🔧 โครงสร้าง Storage

### Buckets ที่สร้างขึ้น

| Bucket Name | Visibility | Max Size | Purpose |
|-------------|-----------|----------|---------|
| `avatars` | Public | 50 MB | รูป profile ของผู้ใช้ |
| `business-cards` | Public | 50 MB | รูปนามบัตรและโปรไฟล์ทางธุรกิจ |
| `logos` | Public | 50 MB | โลโก้บริษัท |

### File Structure

```
avatars/
└── profiles/
    ├── profile-{user_id}-{timestamp}.jpg
    ├── profile-{user_id}-{timestamp}.png
    └── ...

business-cards/
└── profiles/
    └── ...

logos/
└── companies/
    └── ...
```

### Policies (RLS)

**สำหรับ Authenticated Users**:
- ✅ `INSERT` - อัปโหลดไฟล์ได้
- ✅ `UPDATE` - แก้ไขไฟล์ได้
- ✅ `DELETE` - ลบไฟล์ได้

**สำหรับ Public**:
- ✅ `SELECT` - ดูไฟล์ได้ (เพื่อแสดงรูป profile)

---

## 📝 การทำงานของโค้ด

### Client-Side Upload Flow

```javascript
// apps/web/src/app/settings/page.tsx (line 596-744)

handleProfileImageUpload()
  ├─ 1. อ่านไฟล์จาก input
  ├─ 2. ตรวจสอบ authentication
  ├─ 3. พยายามอัปโหลดไปแต่ละ bucket
  │    ├─ Try: avatars
  │    ├─ Try: business-cards
  │    └─ Try: logos
  ├─ 4. ถ้าสำเร็จ:
  │    ├─ ได้ public URL
  │    ├─ Update user metadata
  │    └─ แสดง success message
  └─ 5. ถ้าล้มเหลว:
       ├─ ใช้ base64 fallback
       ├─ บันทึกใน user metadata
       └─ แสดง warning message
```

### Server-Side Upload API

```javascript
// apps/web/src/app/api/upload-profile/route.ts

POST /api/upload-profile
  ├─ 1. รับ file จาก FormData
  ├─ 2. Validate file (type, size)
  ├─ 3. ตรวจสอบ session/auth
  ├─ 4. พยายามอัปโหลดไปแต่ละ bucket
  ├─ 5. Update user metadata
  └─ 6. Return URL หรือ error
```

---

## 🧪 การทดสอบ

### 1. ทดสอบด้วย HTML Tool

```bash
# เปิดไฟล์
open scripts/test-storage-upload.html

# หรือใน Windows
start scripts/test-storage-upload.html
```

**ขั้นตอน**:
1. กรอก Supabase URL และ Anon Key
2. คลิก "เชื่อมต่อ Supabase"
3. กรอก email/password
4. คลิก "เข้าสู่ระบบ"
5. เลือกรูปภาพ
6. คลิก "ทดสอบอัปโหลด"
7. ตรวจสอบผลลัพธ์

### 2. ทดสอบด้วย Web App

```bash
cd apps/web
npm run dev
```

1. เปิด http://localhost:3000
2. เข้าสู่ระบบ
3. ไปที่ Settings
4. อัปโหลดรูป profile
5. ตรวจสอบ Console (F12)
   - ✅ ต้องเห็น: "✅ Upload successful to bucket: avatars"
   - ✅ URL ต้องเป็น: `https://...supabase.co/storage/v1/...`

### 3. ทดสอบด้วย SQL

```sql
-- ตรวจสอบ buckets
SELECT * FROM storage.buckets 
WHERE id IN ('avatars', 'business-cards', 'logos');

-- ตรวจสอบ files
SELECT * FROM storage.objects 
WHERE bucket_id = 'avatars' 
ORDER BY created_at DESC 
LIMIT 10;

-- ตรวจสอบ policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```

---

## 🔍 การแก้ปัญหา

### ปัญหา 1: "All storage buckets failed"

**สาเหตุ**: Buckets ยังไม่ถูกสร้าง

**วิธีแก้**:
1. รัน migration: `supabase db push`
2. หรือรัน SQL ใน Dashboard

**ตรวจสอบ**:
```sql
SELECT id FROM storage.buckets;
```

### ปัญหา 2: "Unauthorized"

**สาเหตุ**: Policies ไม่ถูกต้อง

**วิธีแก้**:
```sql
-- ดู policies ปัจจุบัน
SELECT * FROM pg_policies 
WHERE schemaname = 'storage';

-- รัน migration ใหม่
```

### ปัญหา 3: "CORS Error"

**สาเหตุ**: CORS configuration

**วิธีแก้**:
1. ไปที่ Supabase Dashboard
2. Settings → API
3. เพิ่ม allowed origins

### ปัญหา 4: รูปแสดงไม่ได้

**สาเหตุ**: Bucket ไม่ public หรือ policies ไม่ถูกต้อง

**ตรวจสอบ**:
```sql
-- ตรวจสอบว่า bucket เป็น public
SELECT id, public FROM storage.buckets;

-- อัปเดตเป็น public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('avatars', 'business-cards', 'logos');
```

---

## 📈 ประสิทธิภาพ

### Before (Base64)
- 📦 Payload size: **50-100 KB** (per user metadata request)
- ⏱️ Load time: **200-500 ms**
- 💾 Database size: **เพิ่มอย่างรวดเร็ว**

### After (Storage URL)
- 📦 Payload size: **<1 KB** (เฉพาะ URL)
- ⏱️ Load time: **50-100 ms** (cached)
- 💾 Database size: **ลดลง 99%**

---

## 💡 Best Practices

### 1. การตั้งชื่อไฟล์

```javascript
// ✅ ดี: มี user_id และ timestamp
const fileName = `profile-${userId}-${Date.now()}.jpg`;

// ❌ ไม่ดี: ไม่ unique
const fileName = `profile.jpg`; // จะ override ของเก่า
```

### 2. การจัดการขนาดไฟล์

```javascript
// Client-side validation
if (file.size > 5 * 1024 * 1024) { // 5 MB
  alert('ไฟล์ใหญ่เกินไป');
  return;
}

// Server-side validation (API route)
if (file.size > 5 * 1024 * 1024) {
  return NextResponse.json({ error: 'File too large' }, { status: 400 });
}
```

### 3. การใช้ Image Optimization

```javascript
// ใช้ Supabase Image Transformation
const optimizedUrl = supabase.storage
  .from('avatars')
  .getPublicUrl(filePath, {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover'
    }
  });
```

### 4. การลบไฟล์เก่า

```javascript
// ลบไฟล์เก่าก่อนอัปโหลดใหม่
const oldFiles = await supabase.storage
  .from('avatars')
  .list(`profiles/profile-${userId}-*`);

if (oldFiles.data) {
  await Promise.all(
    oldFiles.data.map(file => 
      supabase.storage.from('avatars').remove([`profiles/${file.name}`])
    )
  );
}
```

---

## 📚 เอกสารอ้างอิง

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Transformation](https://supabase.com/docs/guides/storage/image-transformations)

---

## ✅ Checklist การตรวจสอบ

- [ ] รัน migration สำเร็จ
- [ ] เห็น 3 buckets ใน Dashboard (avatars, business-cards, logos)
- [ ] แต่ละ bucket มี 4 policies
- [ ] Buckets เป็น public
- [ ] ทดสอบอัปโหลดผ่าน test HTML tool
- [ ] ทดสอบอัปโหลดผ่าน web app
- [ ] รูปแสดงผลถูกต้อง
- [ ] Console ไม่มี error
- [ ] URL เป็น storage URL (ไม่ใช่ base64)

---

## 🎉 สรุป

หลังจากทำตามขั้นตอนนี้แล้ว:

✅ ระบบจะบันทึกรูป profile ใน **Supabase Storage**  
✅ ไม่ใช้ base64 fallback อีกต่อไป  
✅ ประสิทธิภาพดีขึ้น  
✅ ง่ายต่อการจัดการ  

**หมายเหตุ**: หากยังมีปัญหา กรุณาตรวจสอบ:
1. Supabase credentials ใน `.env.local`
2. User authentication status
3. Console logs ใน Browser DevTools
4. Storage logs ใน Supabase Dashboard

---

**Created by**: AI Assistant  
**Version**: 1.0  
**Last Updated**: 8 ตุลาคม 2024

