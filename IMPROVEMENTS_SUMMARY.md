# ✅ สรุปความคืบหน้าและงานที่ยังต้องทำ

ไฟล์นี้รวบรวมประเด็นจาก `SECURITY_AND_PERFORMANCE_AUDIT.md` และ `IMPROVEMENTS_NEEDED.md` เพื่อให้เห็นภาพรวมของสิ่งที่แก้ไขแล้วและสิ่งที่ยังค้างอยู่

---

## 1. ความปลอดภัย (Security)
| รายการ | สถานะ | หมายเหตุ / ขั้นถัดไป |
| --- | --- | --- |
| ตรวจสอบ input ของ Supabase proxy | ✅ | จำกัดตารางที่อนุญาต, sanitize พารามิเตอร์, ตรวจสอบ UUID/order/filter (`apps/web/src/app/api/supabase-proxy/route.ts`). |
| ป้องกัน XSS | ✅ | ค่าที่ส่งเข้า `dangerouslySetInnerHTML` ผ่าน DOMPurify แล้ว. |
| การใช้ alert() | ✅ | เปลี่ยนเป็น `react-hot-toast` ทั้งระบบ. |
| Console log ใน production | ✅ | ปิดอัตโนมัติที่ `app/providers.tsx` (ยกเว้นตั้ง `NEXT_PUBLIC_ENABLE_CLIENT_LOGS=true`). |
| CORS ใน Edge Function | ✅ | `track-view` ใช้ whitelist และ env `ALLOWED_ORIGINS`. |
| Rate limiting | ✅ | มี utility กลาง + ใช้กับ API สำคัญตามระดับความเข้มงวด. |
| การใช้ Service Role Key | ⚠️ รอดำเนินการ | `get-profile`/`update-profile` ยังคงใช้ service role key → ต้องกันการรั่วไหลและพิจารณาย้าย logic ไป layer ที่ปลอดภัยกว่า. |

---

## 2. คุณภาพโค้ดและการดูแล (Code Quality & Maintenance)
| รายการ | สถานะ | หมายเหตุ / ขั้นถัดไป |
| --- | --- | --- |
| Config ที่ hardcode | ✅ | ใช้ env variables แล้ว. |
| API สำหรับ test/debug | ✅ | มี production guard. |
| Type safety | ✅ | Route สำคัญใช้ Supabase `Database` types แล้ว; ควรลด `any` ที่เหลือ. |
| TODO / หน้าเก่า | ✅ | ย้ายหรือลบแล้ว; ไม่มี TODO ใน `settings`. |
| Debug code | ✅ | เอา console.log ออกหรือ wrap ด้วย runtime check. |

---

## 3. ประสิทธิภาพและสถาปัตยกรรม (Performance & Architecture)
| รายการ | สถานะ | หมายเหตุ / ขั้นถัดไป |
| --- | --- | --- |
| ไลบรารี QR-code ซ้ำซ้อน (`qrcode`, `qrcode.react`, `react-qr-code`, `qr-code-styling`) | ❌ ค้าง | เลือกใช้เพียงตัวเดียว (web + mobile) เพื่อลด bundle. |
| Code splitting | ❌ ค้าง | เพิ่ม `next/dynamic` ให้เพจ/คอมโพเนนต์ที่ใหญ่ (editor, settings, dashboard). |
| Response caching | ❌ ค้าง | ใช้ React Query caching + header/revalidate สำหรับ API ที่เรียกซ้ำ. |
| Image optimization | ❌ ค้าง | ตรวจสอบ `<img>` แล้วเปลี่ยนเป็น `next/image` เมื่อเป็นไปได้. |
| Dependency ที่ไม่ใช้ / shared utilities | ⚠️ ทำบางส่วน | มี shared utils สำหรับ vCard/QR แล้ว แต่ควรตรวจ `package.json` เพิ่มเติม. |

---

## 4. การทดสอบและเอกสาร (Testing & Documentation)
| รายการ | สถานะ | หมายเหตุ |
| --- | --- | --- |
| Integration tests | ✅ | ครอบคลุม contact, profile, web-settings, update-profile APIs + helper utils. |
| เอกสาร API | ✅ | มี OpenAPI (`docs/api/openapi.yaml`) และ README. |

---

## 5. แผนงานที่ยังเหลือ (Action Plan)
1. **เพิ่มความปลอดภัยให้ Service Role Key**
   - พิจารณาย้าย logic ที่ต้องใช้สิทธิ์สูงไป Supabase Edge Functions หรือ server-side layer
   - ตั้งระบบ log/monitoring เพื่อดูการใช้งานผิดปกติ
2. **ปรับปรุงประสิทธิภาพ**
   - รวมไลบรารี QR-code ให้เหลือตัวเดียว (ลบอีก 3 ตัวจาก `package.json`)
   - เพิ่ม `next/dynamic` ให้เพจ/คอมโพเนนต์ขนาดใหญ่ (`card-editor`, `settings`, `dashboard/DashboardContent`, ส่วนของ theme designer)
   - เปิด cache (ตั้ง `staleTime` ใน React Query + header/revalidate สำหรับ `/api/get-profile`, `/api/templates`, `/api/card-views`)
   - ตรวจ `<img>` ที่เหลือ (landing hero, avatar/logo ใน settings, template preview) แล้วใช้ `next/image` พร้อม `sizes`
3. **ตรวจสอบ  **
   - รัน `npm ls` หรือ `depcheck` เพื่อเอาแพ็กเกจที่ไม่ได้ใช้ออก (ทั้ง web และ mobile)
4. **เพิ่มความเข้มงวดด้าน Type Safety**
   - ค่อย ๆ แทนที่ `any` ที่ยังเหลือ โดยเฉพาะ API routes ที่ไม่ค่อยถูกแตะ

ใช้ไฟล์นี้เป็น checklist สำหรับงานที่เหลือ และอัปเดตทุกครั้งเมื่อทำเสร็จหรือมีการเปลี่ยนลำดับความสำคัญ