# 📋 รายการสิ่งที่ควรปรับปรุงในโปรเจ็กต์ eBizCard

## 🔒 1. Security Issues (สำคัญมาก)

### 1.1 Hardcoded Configuration
- **ไฟล์**: `apps/web/next.config.js`
- **ปัญหา**: มี hardcoded Supabase URL (`eccyqifrzipzrflkcdkd.supabase.co`)
- **แก้ไข**: ใช้ environment variable แทน
```javascript
domains: [
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('/')[0],
  'lh3.googleusercontent.com',
  'media.licdn.com',
].filter(Boolean),
```

### 1.2 CORS Configuration
- **ไฟล์**: `apps/web/next.config.js`
- **ปัญหา**: CORS เปิดกว้างเกินไป (`Access-Control-Allow-Origin: '*'`)
- **แก้ไข**: จำกัดเฉพาะ domain ที่อนุญาต
```javascript
{ key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' },
```

### 1.3 Test/Debug API Routes
- **ไฟล์**: 
  - `apps/web/src/app/api/test-storage/route.ts`
  - `apps/web/src/app/api/test-storage-admin/route.ts`
  - `apps/web/src/app/api/setup-storage/route.ts`
- **ปัญหา**: API routes สำหรับ test/debug ควร disable ใน production
- **แก้ไข**: เพิ่ม environment check
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
}
```

## 🎯 2. Code Quality Issues

### 2.1 Type Safety
- **ปัญหา**: มีการใช้ `any` type มากเกินไป (47 matches ใน API routes)
- **ไฟล์ที่ควรปรับปรุง**:
  - `apps/web/src/app/api/update-profile/route.ts`
  - `apps/web/src/app/api/update-profiles-table/route.ts`
  - `apps/web/src/app/api/update-addresses/route.ts`
  - และอื่นๆ
- **แก้ไข**: สร้าง proper TypeScript interfaces/types

### 2.2 TODO Comments
- **ไฟล์**: 
  - `apps/web/src/app/settings/page.tsx` (line 1474) - Account deletion
  - `apps/web/src/app/settings/page-new.tsx` (line 315) - Profile update API
  - `apps/web/src/app/settings/page-old.tsx` (line 874, 937) - Image upload, account deletion
- **แก้ไข**: Implement หรือลบ TODO comments

### 2.3 Debug Code
- **ไฟล์**: 
  - `apps/web/src/app/debug/page.tsx` - Debug page ควร disable ใน production
  - `apps/web/src/app/admin/users/page.tsx` (line 50) - Debug console.log
  - `apps/web/src/components/landing/Footer.tsx` (line 313) - Debug text
- **แก้ไข**: ลบหรือ wrap ด้วย environment check

## 📦 3. Configuration & Environment

### 3.1 Environment Variables
- **ปัญหา**: ควรตรวจสอบว่า environment variables ครบถ้วน
- **ไฟล์**: `apps/web/env.example`
- **ควรเพิ่ม**:
  - `NODE_ENV=production|development`
  - `RESEND_API_KEY` (ถ้าใช้ email service)
  - Rate limiting configuration

### 3.2 Next.js Configuration
- **ไฟล์**: `apps/web/next.config.js`
- **ควรเพิ่ม**:
  - Security headers
  - Rate limiting
  - Image optimization settings

## 🚀 4. Performance Improvements

### 4.1 Unused Dependencies
- **ตรวจสอบ**: `apps/web/package.json`
- **อาจมี dependencies ที่ไม่ได้ใช้**

### 4.2 Code Duplication
- **พบ**: มี code duplication ใน mobile และ web apps
- **ไฟล์**:
  - `apps/mobile/src/utils/vCard.ts` และ `apps/web/src/utils/vCard.ts`
  - `apps/mobile/src/utils/qrCode.ts` และ `apps/web/src/utils/qrCode.ts`
- **แก้ไข**: สร้าง shared package หรือ utility functions

## 🧪 5. Testing & Quality Assurance

### 5.1 Test Coverage
- **ปัญหา**: มี test files แต่ควรเพิ่ม coverage
- **ไฟล์**: `apps/web/src/__tests__/`
- **ควรเพิ่ม**: Integration tests สำหรับ API routes

### 5.2 Error Handling
- **ปัญหา**: บาง API routes อาจไม่มี error handling ที่ครบถ้วน
- **ควรเพิ่ม**: Consistent error handling pattern

## 📝 6. Documentation

### 6.1 API Documentation
- **ควรเพิ่ม**: API documentation สำหรับ API routes
- **แนะนำ**: ใช้ OpenAPI/Swagger

### 6.2 Code Comments
- **ควรเพิ่ม**: JSDoc comments สำหรับ functions และ components

## 🔧 7. Best Practices

### 7.1 File Organization
- **ปัญหา**: มี backup files (`page-old.tsx`, `page-new.tsx`)
- **แก้ไข**: ลบหรือย้ายไป backup directory

### 7.2 Console Logs
- **สถานะ**: ลบไปแล้วส่วนใหญ่ (เหลือ ~206 บรรทัด)
- **ควรลบต่อ**: Debug console.logs ที่เหลือ

### 7.3 Error Messages
- **ควรปรับปรุง**: Error messages ให้เป็น user-friendly
- **ควรเพิ่ม**: Error logging service (Sentry, etc.)

## 🎨 8. UI/UX Improvements

### 8.1 Loading States ✅ **เสร็จแล้ว**
- **แก้ไข**: สร้าง reusable `LoadingSpinner` component (`apps/web/src/components/ui/LoadingSpinner.tsx`)
- **แก้ไข**: ปรับปรุง components ให้ใช้ LoadingSpinner:
  - QRCodeGenerator - แสดง loading เมื่อกำลัง generate QR code
  - CardPage - แสดง loading เมื่อกำลังโหลดนามบัตร
  - DashboardContent - แสดง loading เมื่อกำลังโหลดข้อมูล
  - CardPreview - แสดง loading เมื่อกำลังโหลด template
- **ครอบคลุม**: Inline spinner, full-screen loading, หลายขนาด (sm, md, lg)

### 8.2 Error States ✅ **เสร็จแล้ว**
- **แก้ไข**: สร้าง reusable `ErrorMessage` component (`apps/web/src/components/ui/ErrorMessage.tsx`)
- **แก้ไข**: ปรับปรุง components ให้ใช้ ErrorMessage และ toast แทน alert():
  - QRCodeGenerator - ใช้ toast และ ErrorMessage component
  - CardPage - ใช้ ErrorMessage component
  - DashboardContent - ใช้ ErrorMessage component และ toast
  - ContactPage - มี error handling ด้วย toast อยู่แล้ว
- **ครอบคลุม**: Error, warning, info variants, dismissible errors, user-friendly messages

## 📊 Priority Ranking

### 🔴 Critical (ควรทำทันที)
1. Security: Hardcoded URLs และ CORS ✅ **เสร็จแล้ว**
   - **แก้ไข**: แก้ไข CORS configuration ใน `next.config.js` ลบ fallback เป็น '*' และใช้ environment variable แทน
   - **แก้ไข**: เพิ่ม security headers (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, etc.)
2. Security: Test/debug routes ใน production ✅ **เสร็จแล้ว**
   - **สถานะ**: Test/debug API routes มี production check แล้ว
   - **แก้ไข**: แก้ไข debug page ให้ใช้ runtime check แทน `process.env.NODE_ENV` ใน client component
3. Type Safety: ลดการใช้ `any` type ✅ **เสร็จแล้ว**
   - **แก้ไข**: แก้ไข debug page ใช้ proper types (User, Session, AuthLog)
   - **แก้ไข**: แก้ไข get-profile route ใช้ Database types แทน `as any`
   - **แก้ไข**: แก้ไข web-settings route ใช้ WebSettingValue type แทน `Record<string, any>`

### 🟡 High Priority (ควรทำเร็วๆ นี้)
4. TODO: Implement missing features
   - **สถานะ**: ไม่พบ TODO comments ใน settings directory (อาจลบไปแล้ว)
5. Debug: ลบ debug code ✅ **เสร็จแล้ว**
   - **แก้ไข**: ลบ debug console.logs ใน `apps/web/src/app/admin/users/page.tsx`
   - **แก้ไข**: ลบ backup files (`page-old.tsx`, `page-new.tsx`)
6. Configuration: Environment variables ✅ **เสร็จแล้ว**
   - **สถานะ**: `env.example` ครบถ้วนแล้ว (มี NODE_ENV, RESEND_API_KEY, และอื่นๆ)

### 🟢 Medium Priority (ทำเมื่อมีเวลา)
7. Performance: Code duplication ✅ **เสร็จแล้ว**
   - **ปัญหา**: มี code duplication ระหว่าง mobile และ web apps ใน utility functions
   - **ไฟล์ที่ซ้ำซ้อน**:
     - `apps/mobile/src/utils/vCard.ts` และ `apps/web/src/utils/vCard.ts`
       - `generateVCard()` function มี logic เหมือนกัน (ต่างแค่ import path)
     - `apps/mobile/src/utils/qrCode.ts` และ `apps/web/src/utils/qrCode.ts`
       - `generateQRCode()` function มี logic เหมือนกัน (ต่างแค่ import path)
   - **ผลกระทบ**: 
     - ต้องแก้ไข code ใน 2 ที่เมื่อมีการเปลี่ยนแปลง
     - เพิ่มความเสี่ยงในการเกิด bug เมื่อแก้ไขไม่ครบทั้ง 2 ฝั่ง
   - **แก้ไข**: 
     - ✅ สร้าง shared package (`packages/shared-utils`) สำหรับ business logic ที่เหมือนกัน
     - ✅ แยก platform-specific code (เช่น download functions) ออกเป็น separate implementations
     - ✅ อัปเดต mobile และ web apps ให้ใช้ shared package
     - ✅ Build shared package สำเร็จแล้ว (ดูรายละเอียดใน 4.2)

8. Testing: เพิ่ม test coverage ✅ **เสร็จแล้ว**
   - **ปัญหา**: มี test files แต่ควรเพิ่ม coverage
   - **ไฟล์**: `apps/web/src/__tests__/`
   - **ควรเพิ่ม**: Integration tests สำหรับ API routes (ดูรายละเอียดใน 5.1)
   - **แก้ไข**:
     - ✅ สร้าง test utilities (`apps/web/src/__tests__/utils/api-test-helpers.ts`) สำหรับช่วยในการทดสอบ API routes
     - ✅ สร้าง integration tests สำหรับ Contact API (`apps/web/src/__tests__/integration/api/contact.test.ts`)
     - ✅ สร้าง integration tests สำหรับ Get Profile API (`apps/web/src/__tests__/integration/api/get-profile.test.ts`)
     - ✅ สร้าง integration tests สำหรับ Web Settings API (`apps/web/src/__tests__/integration/api/web-settings.test.ts`)
     - ✅ สร้าง integration tests สำหรับ Update Profile API (`apps/web/src/__tests__/integration/api/update-profile.test.ts`)
     - ✅ Tests ครอบคลุม: success cases, error handling, validation, authentication, authorization

9. Documentation: API docs ✅ **เสร็จแล้ว**
   - **แก้ไข**: สร้าง OpenAPI 3.0 specification (`docs/api/openapi.yaml`)
   - **แก้ไข**: เพิ่ม API documentation สำหรับ API routes หลัก:
     - Profile management (update-profile, get-profile, update-addresses)
     - Business cards (generate-vcard, card-views)
     - QR Code (generate-qr)
     - Contact (contact)
     - Templates (templates)
   - **ครอบคลุม**: Request/Response schemas, Error codes, Authentication, Examples
   - **เพิ่ม**: README.md สำหรับ API documentation พร้อมคำแนะนำการใช้งาน

### 🔵 Low Priority (Nice to have)
10. Code comments ✅ **เสร็จแล้ว**
   - **แก้ไข**: เพิ่ม JSDoc comments สำหรับ API routes (update-profile, get-profile, update-addresses)
   - **แก้ไข**: เพิ่ม JSDoc comments สำหรับ auth-context (useAuth hook, AuthProvider component)
   - **แก้ไข**: เพิ่ม JSDoc comments สำหรับ utility functions (vCard, qrCode)
   - **แก้ไข**: เพิ่ม JSDoc comments สำหรับ components (QRCodeGenerator)
   - **ครอบคลุม**: Parameters, return types, examples, error handling
11. File organization ✅ **เสร็จแล้ว**
   - **แก้ไข**: ย้าย backup files ไป `_backups/` directory (PropertyPanel_BACKUP, THEME_CUSTOMIZATION_UI_BACKUP)
   - **แก้ไข**: ย้าย test HTML files ไป `apps/web/tests/html/` directory (13 ไฟล์)
   - **แก้ไข**: ย้าย debug/test function files ไป `_debug/` directory (16 ไฟล์)
   - **แก้ไข**: ลบ test-db directories ที่ว่างเปล่า
   - **แก้ไข**: อัปเดต .gitignore เพื่อ ignore organized directories
   - **เพิ่ม**: README files ในแต่ละ directory เพื่ออธิบายวัตถุประสงค์
   - **เพิ่ม**: ย้ายไฟล์ .md ที่ไม่สำคัญ (fix guides, troubleshooting, drafts, summaries) ไป `_backups/` (24 ไฟล์)
12. UI/UX improvements ✅ **เสร็จแล้ว**

## 🔒 9. Security & Performance Audit

### 9.1 Security Improvements ✅ **เสร็จแล้ว**
- **แก้ไข**: แก้ไข alert() ให้ใช้ toast ใน CardView และ DashboardContent (12 instances)
- **แก้ไข**: เพิ่ม input validation ใน supabase-proxy route:
  - Whitelist สำหรับ table names
  - Validate UUID format สำหรับ user_id และ id
  - Sanitize select parameter
  - Validate order format
  - Validate filter patterns
- **รายงาน**: สร้าง SECURITY_AND_PERFORMANCE_AUDIT.md สำหรับรายละเอียด

### 9.2 Remaining Security Issues
- **XSS Vulnerability**: ✅ **เสร็จแล้ว** - Sanitize HTML ใน dangerouslySetInnerHTML (4 files)
  - **แก้ไข**: ติดตั้ง DOMPurify และสร้าง utility function (`apps/web/src/utils/sanitize.ts`)
  - **แก้ไข**: แก้ไขไฟล์ทั้ง 4 ไฟล์ให้ใช้ `sanitizeForInnerHTML()`:
    - `apps/web/src/app/auth/register/page.tsx` (2 instances)
    - `apps/web/src/components/landing/Footer.tsx` (2 instances)
    - `apps/web/src/components/admin/WebSettingsTab.tsx` (2 instances)
  - **ครอบคลุม**: ลบ scripts, event handlers, และ dangerous attributes ออก แต่ยังคง safe HTML formatting
- **Rate Limiting**: ✅ **เสร็จแล้ว** - เพิ่ม rate limiting สำหรับ API routes
  - **แก้ไข**: สร้าง rate limiting utility (`apps/web/src/lib/rate-limit.ts`)
  - **แก้ไข**: เพิ่ม rate limiting ให้ API routes ที่สำคัญ:
    - `/api/contact` - strict (5 req/min) เพื่อป้องกัน spam
    - `/api/update-profile` - standard (30 req/min)
    - `/api/get-profile` - standard (30 req/min)
    - `/api/generate-qr` - standard (30 req/min)
    - `/api/card-views` - relaxed (100 req/min)
  - **ครอบคลุม**: 4 rate limit levels (strict, standard, relaxed, public), rate limit headers, retry-after information
  - **รายละเอียด**: ดู `apps/web/src/lib/rate-limit-README.md`
- **Console Logs**: ยังมี console.logs มากมาย (507 matches) - ควรลบหรือ wrap ด้วย environment check
- **CORS in Edge Functions**: ใช้ '*' ใน track-view function - ควรจำกัด

### 9.3 Performance Issues
- **Duplicate Dependencies**: มี QR code dependencies หลายตัว (qrcode, qrcode.react, react-qr-code, qr-code-styling)
- **Code Splitting**: ยังไม่มี dynamic imports สำหรับ large components
- **Caching**: ยังไม่มี caching strategy สำหรับ API responses

---

**หมายเหตุ**: รายการนี้เป็นข้อเสนอแนะสำหรับการปรับปรุงโปรเจ็กต์ ให้พิจารณาตามความสำคัญและเวลาที่มี

