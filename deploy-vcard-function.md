# Deploy vCard Function

## สถานการณ์
ได้แก้ไขโค้ด vCard generation ในทั้งสองไฟล์แล้ว:
- `apps/api/supabase/functions/generate-vcard/index.ts`
- `ebizcard/apps/api/supabase/functions/generate-vcard/index.ts`

## การแก้ไขที่ทำ
1. เพิ่มการรองรับ `field_values` จากฐานข้อมูล
2. ใช้ข้อมูลจาก `field_values` เป็นหลัก ถ้าไม่มีค่อยใช้ข้อมูลพื้นฐาน
3. เพิ่มฟิลด์เพิ่มเติมเป็น NOTE ใน vCard

## ขั้นตอนการ Deploy

### วิธีที่ 1: ใช้ Supabase CLI
```bash
# ติดตั้ง Supabase CLI ถ้ายังไม่มี
npm install -g supabase

# ไปที่ directory หลัก
cd d:\Project\eBizCard

# Deploy function
supabase functions deploy generate-vcard

# หรือ deploy ทั้งหมด
supabase functions deploy
```

### วิธีที่ 2: ใช้ Supabase Dashboard
1. เข้า Supabase Dashboard
2. ไปที่ Edge Functions
3. คลิก "Deploy new function"
4. อัปโหลดไฟล์ `generate-vcard/index.ts` ที่แก้ไขแล้ว

### วิธีที่ 3: ใช้ GitHub Actions (ถ้ามี)
Push code ไปยัง GitHub และให้ CI/CD deploy อัตโนมัติ

## การทดสอบ
หลังจาก deploy แล้ว:
1. ลองดาวน์โหลด vCard ใหม่
2. ตรวจสอบว่ามีข้อมูลครบทั้ง 10 ฟิลด์หรือไม่
3. ตรวจสอบว่า field_values ถูกประมวลผลถูกต้อง

## หมายเหตุ
- ต้องแน่ใจว่า migration `025_add_template_fields_to_business_cards.sql` ได้รันแล้ว
- ตรวจสอบว่าในฐานข้อมูลมีคอลัมน์ `field_values` และ `template_id`
