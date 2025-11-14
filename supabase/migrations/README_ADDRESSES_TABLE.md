# Addresses Table Migration

## ภาพรวม
Migration นี้สร้าง `addresses` table ใหม่เพื่อเก็บข้อมูลที่อยู่ของผู้ใช้แยกจาก `user_metadata`

## โครงสร้าง Table

### Fields
- `id` (UUID, Primary Key) - รหัสประจำตัวของที่อยู่
- `user_id` (UUID, Foreign Key) - อ้างอิงไปยัง auth.users(id)
- `type` (TEXT, Required) - ประเภทที่อยู่ ('home', 'work', 'other')
- `place` (TEXT, Optional) - สถานที่ เช่น ชื่ออาคาร, ชื่อหมู่บ้าน, ชื่อคอนโด
- `address` (TEXT, Required) - ที่อยู่
- `tambon` (TEXT, Required) - ตำบล/แขวง
- `district` (TEXT, Required) - อำเภอ/เขต
- `province` (TEXT, Required) - จังหวัด
- `postal_code` (TEXT, Optional) - รหัสไปรษณีย์
- `country` (TEXT, Optional) - ประเทศ (default: 'Thailand')
- `created_at` (TIMESTAMP) - เวลาที่สร้าง
- `updated_at` (TIMESTAMP) - เวลาที่อัปเดตล่าสุด

### Indexes
- `idx_addresses_user_id` - สำหรับ query ตาม user_id
- `idx_addresses_type` - สำหรับ query ตาม type

### Security
- RLS (Row Level Security) เปิดใช้งาน
- Policy: ผู้ใช้สามารถจัดการที่อยู่ของตนเองได้เท่านั้น

## การใช้งาน

### เพิ่มที่อยู่ใหม่
```sql
INSERT INTO public.addresses (user_id, type, place, address, tambon, district, province, postal_code, country)
VALUES (
  'user-uuid-here',
  'home',
  'U-delight 2 @ Bangsue Station',
  '695/539 ซอยประชาชื่น 19',
  'บางซื่อ',
  'บางซื่อ',
  'กรุงเทพมหานคร',
  '10800',
  'Thailand'
);
```

### ดึงข้อมูลที่อยู่ของผู้ใช้
```sql
SELECT * FROM public.addresses 
WHERE user_id = 'user-uuid-here' 
ORDER BY created_at DESC;
```

### อัปเดตที่อยู่
```sql
UPDATE public.addresses 
SET place = 'New Place Name', address = 'New Address'
WHERE id = 'address-uuid-here' AND user_id = 'user-uuid-here';
```

### ลบที่อยู่
```sql
DELETE FROM public.addresses 
WHERE id = 'address-uuid-here' AND user_id = 'user-uuid-here';
```

## การ Migration จาก user_metadata

หากต้องการย้ายข้อมูลจาก `user_metadata.addresses` ไปยัง table ใหม่ สามารถใช้ script นี้:

```sql
-- ตัวอย่างการย้ายข้อมูล (ต้องปรับแต่งตามโครงสร้างข้อมูลจริง)
INSERT INTO public.addresses (user_id, type, place, address, tambon, district, province, postal_code, country)
SELECT 
  id as user_id,
  COALESCE(address_data->>'type', 'home') as type,
  address_data->>'place' as place,
  address_data->>'address' as address,
  address_data->>'tambon' as tambon,
  address_data->>'district' as district,
  address_data->>'province' as province,
  address_data->>'postalCode' as postal_code,
  COALESCE(address_data->>'country', 'Thailand') as country
FROM auth.users,
LATERAL jsonb_array_elements(raw_user_meta_data->'addresses') as address_data
WHERE raw_user_meta_data->'addresses' IS NOT NULL;
```

## หมายเหตุ
- Table นี้รองรับ field `place` ที่ไม่เคยมีใน user_metadata
- มีการตรวจสอบข้อมูลที่เข้มงวดมากขึ้น
- รองรับการ query และ index ที่ดีกว่า
- มี RLS เพื่อความปลอดภัย
