# User Metadata Sync System

ระบบนี้ทำให้ `user_metadata` อัพเดตอัตโนมัติเมื่อข้อมูลใน table `addresses` ของ Supabase เปลี่ยนแปลง

## วิธีการทำงาน

### 1. Database Trigger (วิธีหลัก - แนะนำ)
- **ไฟล์:** `supabase/migrations/009_sync_user_metadata_trigger.sql`
- **การทำงาน:** Trigger จะทำงานอัตโนมัติเมื่อมีการ INSERT, UPDATE, หรือ DELETE ใน table `addresses`
- **ข้อดี:** อัพเดตทันที ไม่ต้องรอ API call
- **ข้อเสีย:** ต้องมี SERVICE_ROLE_KEY

### 2. API Route
- **ไฟล์:** `apps/web/src/app/api/sync-user-metadata/route.ts`
- **การทำงาน:** API ที่สามารถเรียกใช้เพื่อ sync ข้อมูล user_metadata
- **การใช้งาน:**
  ```javascript
  const response = await fetch('/api/sync-user-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id })
  });
  ```

### 3. Supabase Edge Function
- **ไฟล์:** `apps/web/supabase/functions/sync-user-metadata/index.ts`
- **การทำงาน:** Edge function ที่สามารถเรียกใช้ผ่าน Supabase Functions
- **ข้อดี:** สามารถเรียกใช้จากหลายที่ได้

### 4. Realtime Hook
- **ไฟล์:** `apps/web/src/hooks/useAddressSync.ts`
- **การทำงาน:** Hook ที่ฟัง realtime changes และ sync ข้อมูลอัตโนมัติ
- **การใช้งาน:**
  ```javascript
  const { syncUserMetadata } = useAddressSync({
    onAddressChange: (addresses) => {
      // Handle address changes
    },
    onMetadataUpdate: (result) => {
      // Handle metadata updates
    }
  });
  ```

## การติดตั้ง

### 1. ติดตั้ง Database Trigger
```bash
# รัน migration
supabase db push
```

### 2. Deploy Edge Function (ถ้าต้องการ)
```bash
supabase functions deploy sync-user-metadata
```

### 3. ตั้งค่า Environment Variables
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## โครงสร้างข้อมูลใน user_metadata

หลังจาก sync แล้ว user_metadata จะมีข้อมูลดังนี้:

```json
{
  "address": "1 ถ.ปูนซิเมนต์ไทย บางซื่อ บางซื่อ กรุงเทพมหานคร 10800",
  "address_detail": "1 ถ.ปูนซิเมนต์ไทย",
  "tambon": "บางซื่อ",
  "district": "บางซื่อ",
  "province": "กรุงเทพมหานคร",
  "postal_code": "10800",
  "place": "สถานที่สำคัญ",
  "last_address_sync": "2024-01-01T00:00:00.000Z",
  "addresses": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "work",
      "address": "1 ถ.ปูนซิเมนต์ไทย",
      "tambon": "บางซื่อ",
      "district": "บางซื่อ",
      "province": "กรุงเทพมหานคร",
      "postal_code": "10800",
      "is_primary": true
    }
  ]
}
```

## การใช้งานใน Card Editor

Card Editor จะใช้ `user_metadata` เป็นหลักสำหรับการแสดงที่อยู่:

```javascript
// Priority 1: user_metadata.address (synced from addresses table)
const fullUserAddress = user?.user_metadata?.address || '';

// Priority 2: Combine components from user_metadata
const addressParts = [];
if (user?.user_metadata?.address_detail) addressParts.push(user.user_metadata.address_detail);
if (user?.user_metadata?.tambon) addressParts.push(user.user_metadata.tambon);
// ... และอื่นๆ

// Priority 3: Fallback to formData.address
```

## การทดสอบ

1. **ทดสอบ Database Trigger:**
   ```sql
   -- เพิ่มที่อยู่ใหม่
   INSERT INTO addresses (user_id, type, address, tambon, district, province, postal_code, is_primary)
   VALUES ('user-id', 'work', 'ที่อยู่ใหม่', 'ตำบล', 'อำเภอ', 'จังหวัด', '12345', true);
   
   -- ตรวจสอบ user_metadata
   SELECT raw_user_meta_data FROM auth.users WHERE id = 'user-id';
   ```

2. **ทดสอบ API:**
   ```bash
   curl -X POST http://localhost:3000/api/sync-user-metadata \
     -H "Content-Type: application/json" \
     -d '{"userId": "user-id"}'
   ```

3. **ทดสอบ Realtime:**
   - เปิด browser console
   - แก้ไขข้อมูลใน table addresses
   - ดู log ว่ามีการ sync หรือไม่

## หมายเหตุ

- ระบบจะใช้ที่อยู่ที่มี `is_primary = true` เป็นหลัก
- หากไม่มี primary address จะใช้ที่อยู่ล่าสุด (เรียงตาม `created_at`)
- หากไม่มีที่อยู่เลย จะล้างข้อมูลที่อยู่ใน user_metadata
- ระบบรองรับการ sync แบบ realtime และ manual
