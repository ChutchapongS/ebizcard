# 🛡️ แก้ไขปัญหา Storage แบบปลอดภัย

> **ปัญหา**: `ERROR: 42501: must be owner of table objects`  
> **วิธีแก้**: ใช้สคริปต์ที่ปลอดภัยกว่า

---

## 🔍 สาเหตุของปัญหา

Error `42501: must be owner of table objects` เกิดจาก:
- **สิทธิ์ไม่เพียงพอ**: User ปัจจุบันไม่มีสิทธิ์ owner ของ table `storage.objects`
- **RLS Policies**: ไม่สามารถจัดการ RLS policies ได้โดยตรง

---

## ⚡ แก้ไขแบบปลอดภัย

### 1️⃣ ใช้ Safe Storage Fix

**เปิด**: https://supabase.com/dashboard  
**ไปที่**: SQL Editor  
**Copy**: เนื้อหาจากไฟล์ `scripts/safe-storage-fix.sql`  
**Paste**: และกด **Run**

### 2️⃣ ตรวจสอบผลลัพธ์

**ต้องเห็น**:
```
✅ Buckets: 3 / 3
✅ Policies: 2
✅ RLS Enabled: Yes
🎉 การแก้ไขแบบปลอดภัยสำเร็จ!
```

### 3️⃣ ทดสอบการอัปโหลด

```bash
cd apps/web
npm run dev
```

**เปิด**: http://localhost:3000/settings  
**ลอง**: อัปโหลดรูป profile  
**ดู**: Console ต้องเห็น:
```
✅ อัปโหลดสำเร็จไปที่ bucket: avatars
🔗 URL: https://...supabase.co/storage/v1/...
```

---

## 🔧 หากยังไม่ได้

### วิธีแก้ไขเพิ่มเติม

#### 1️⃣ ใช้ Supabase Dashboard UI

**แทนการใช้ SQL**:
1. ไปที่ **Storage** → **Buckets**
2. สร้าง buckets ใหม่:
   - `avatars` (Public)
   - `business-cards` (Public)  
   - `logos` (Public)
3. ตั้งค่า Policies:
   - **Insert**: Authenticated users
   - **Select**: Public
   - **Update**: Authenticated users
   - **Delete**: Authenticated users

#### 2️⃣ ใช้ Supabase CLI

```bash
# ติดตั้ง Supabase CLI
npm install -g supabase

# Link โปรเจกต์
supabase link --project-ref YOUR_PROJECT_REF

# รัน migrations
supabase db push
```

#### 3️⃣ ใช้ API Route แทน

**แก้ไข**: `apps/web/src/app/settings/page.tsx`

```javascript
// ใช้ server-side upload แทน client-side
const handleProfileImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append('profile', file);
    
    const response = await fetch('/api/upload-profile', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      setProfileImage(result.imageUrl);
      alert('อัปโหลดสำเร็จ!');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Upload error:', error);
    // Fallback to base64
  }
};
```

---

## 📊 เปรียบเทียบวิธีแก้ไข

| วิธี | ข้อดี | ข้อเสีย | ความยาก |
|------|-------|---------|---------|
| **Safe SQL** | ปลอดภัย, ไม่ต้องสิทธิ์พิเศษ | อาจไม่ครอบคลุมทุกกรณี | ⭐⭐☆☆☆ |
| **Dashboard UI** | ง่าย, ไม่ต้องเขียน SQL | ใช้เวลานาน, ต้องทำทีละขั้น | ⭐⭐⭐☆☆ |
| **Supabase CLI** | ครอบคลุม, ใช้ migrations | ต้องติดตั้ง CLI | ⭐⭐⭐⭐☆ |
| **API Route** | หลีกเลี่ยงปัญหา Storage | ต้องแก้โค้ด | ⭐⭐⭐☆☆ |

---

## 🎯 แนะนำลำดับการแก้ไข

### ลำดับที่ 1: Safe SQL (ลองก่อน)
```sql
-- รัน scripts/safe-storage-fix.sql
```

### ลำดับที่ 2: Dashboard UI (หาก SQL ไม่ได้)
1. ไปที่ Storage → Buckets
2. สร้าง buckets ใหม่
3. ตั้งค่า Policies

### ลำดับที่ 3: API Route (หาก Storage ยังไม่ได้)
```javascript
// ใช้ server-side upload
const response = await fetch('/api/upload-profile', {
  method: 'POST',
  body: formData
});
```

---

## 🔍 ตรวจสอบสิทธิ์

### ตรวจสอบสิทธิ์ปัจจุบัน

```sql
-- รันใน SQL Editor
SELECT 
  current_user as current_user,
  session_user as session_user,
  has_schema_privilege(current_user, 'storage', 'USAGE') as can_use_storage,
  has_table_privilege(current_user, 'storage.objects', 'SELECT') as can_select,
  has_table_privilege(current_user, 'storage.objects', 'INSERT') as can_insert;
```

### ตรวจสอบ RLS Status

```sql
-- รันใน SQL Editor
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'objects' AND relnamespace = 'storage'::regnamespace;
```

---

## 📞 หากยังไม่ได้

### ข้อมูลที่ควรระบุเมื่อขอความช่วยเหลือ

1. **ผลลัพธ์จาก Safe SQL**:
   ```
   Buckets: X / 3
   Policies: X
   RLS Enabled: Yes/No
   ```

2. **Error Messages**:
   ```
   ERROR: 42501: must be owner of table objects
   ```

3. **สิทธิ์ปัจจุบัน**:
   ```
   current_user: postgres
   can_use_storage: true/false
   can_select: true/false
   ```

4. **Screenshots**:
   - Supabase Dashboard → Storage → Buckets
   - Supabase Dashboard → Authentication → Users

---

## 🎉 สรุป

**ปัญหาหลัก**: สิทธิ์ไม่เพียงพอในการจัดการ RLS policies  
**วิธีแก้**: ใช้ `safe-storage-fix.sql` หรือ Dashboard UI  
**ผลลัพธ์**: อัปโหลดสำเร็จไปยัง Supabase Storage

---

**ใช้เวลาเพียง 5 นาที!** ⏰
