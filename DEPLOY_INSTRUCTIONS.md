# คำแนะนำการ Deploy Function ไปยัง Supabase

## วิธีที่ 1: ใช้ Supabase Dashboard (แนะนำ)

1. ไปที่ https://supabase.com/dashboard
2. เลือกโปรเจกต์ของคุณ (eccyqifrzipzrflkcdkd)
3. ไปที่ **Edge Functions** ในเมนูด้านซ้าย
4. คลิกที่ function `generate-vcard` (หรือสร้างใหม่ถ้ายังไม่มี)
5. คลิก **"Edit Function"** หรือ **"Deploy"**
6. คัดลอกเนื้อหาจากไฟล์ `apps/api/supabase/functions/generate-vcard/index.ts`
7. วางใน editor และคลิก **"Deploy"** หรือ **"Save"**

## วิธีที่ 2: ใช้ Supabase CLI

### ติดตั้ง Supabase CLI (ถ้ายังไม่มี):
```bash
npm install -g supabase
```

### Login เข้า Supabase:
```bash
supabase login
```

### Link โปรเจกต์:
```bash
supabase link --project-ref eccyqifrzipzrflkcdkd
```

### Deploy Function:
```bash
cd apps/api/supabase/functions
supabase functions deploy generate-vcard
```

## วิธีที่ 3: ใช้ npx (ไม่ต้องติดตั้ง)

```bash
cd apps/api/supabase/functions
npx supabase functions deploy generate-vcard --project-ref eccyqifrzipzrflkcdkd
```

## หมายเหตุ

- หลังจาก deploy แล้ว ให้ทดสอบการดาวน์โหลด vCard อีกครั้ง
- ตรวจสอบว่า NOTE field รวมเป็นบรรทัดเดียวแล้วหรือไม่
- ถ้ายังมีปัญหา อาจต้องตรวจสอบ field type ที่ใช้จริงในฐานข้อมูล

