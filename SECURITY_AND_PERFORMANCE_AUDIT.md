# 🔒 Security & Performance Audit Report

## 🔴 Critical Security Issues

### 1. Input Validation & SQL Injection Risk
**ไฟล์**: `apps/web/src/app/api/supabase-proxy/route.ts`
- **ปัญหา**: ไม่มีการ validate/sanitize query parameters ก่อนส่งไป Supabase
- **ความเสี่ยง**: SQL injection ผ่าน query parameters
- **แก้ไข**: เพิ่ม whitelist สำหรับ table names และ validate query parameters

### 2. XSS Vulnerability (dangerouslySetInnerHTML) ✅ **แก้ไขแล้ว**
**ไฟล์**: 
- `apps/web/src/app/auth/register/page.tsx` (lines 484, 566)
- `apps/web/src/components/landing/Footer.tsx` (lines 308, 390)
- `apps/web/src/components/admin/WebSettingsTab.tsx` (lines 1483, 1528)
- **ปัญหา**: ใช้ `dangerouslySetInnerHTML` โดยไม่ sanitize HTML
- **ความเสี่ยง**: XSS attacks
- **แก้ไข**: 
  - ✅ ติดตั้ง DOMPurify library
  - ✅ สร้าง utility function `sanitizeForInnerHTML()` ใน `apps/web/src/utils/sanitize.ts`
  - ✅ แก้ไขไฟล์ทั้ง 4 ไฟล์ให้ใช้ sanitized HTML
  - ✅ กำหนด whitelist สำหรับ safe HTML tags และ attributes
  - ✅ ลบ dangerous scripts, event handlers, และ attributes

### 3. Alert() Usage (UX & Security)
**ไฟล์**:
- `apps/web/src/components/dashboard/DashboardContent.tsx` (9 instances)
- `apps/web/src/components/card/CardView.tsx` (3 instances)
- **ปัญหา**: ใช้ `alert()` แทน toast notifications
- **ผลกระทบ**: UX แย่, ไม่สอดคล้องกับ design system
- **แก้ไข**: ใช้ `react-hot-toast` แทน

### 4. Console Logs in Production
**ปัญหา**: มี console.log/error/warn มากมาย (507 matches)
- **ผลกระทบ**: เปิดเผยข้อมูล sensitive, เพิ่ม bundle size
- **แก้ไข**: ลบหรือ wrap ด้วย environment check

### 5. CORS in Edge Functions
**ไฟล์**: `apps/api/supabase/functions/track-view/index.ts`
- **ปัญหา**: ใช้ `Access-Control-Allow-Origin: '*'`
- **แก้ไข**: จำกัดเฉพาะ allowed origins

## 🟡 High Priority Security Issues

### 6. Rate Limiting ✅ **แก้ไขแล้ว**
**ปัญหา**: ไม่มี rate limiting สำหรับ API routes
- **ความเสี่ยง**: DDoS attacks, brute force attacks
- **แก้ไข**: 
  - ✅ สร้าง rate limiting utility (`apps/web/src/lib/rate-limit.ts`)
  - ✅ ใช้ LRU cache สำหรับ in-memory storage
  - ✅ เพิ่ม rate limiting ให้ API routes ที่สำคัญ
  - ✅ 4 rate limit levels: strict (5/min), standard (30/min), relaxed (100/min), public (200/min)
  - ✅ Rate limit headers และ retry-after information
  - ✅ Support สำหรับ proxy/load balancer (X-Forwarded-For, X-Real-IP)

### 7. Service Role Key Exposure Risk
**ไฟล์**: `apps/web/src/app/api/get-profile/route.ts`, `update-profile/route.ts`
- **ปัญหา**: ใช้ service role key ใน API routes
- **ตรวจสอบ**: ต้องแน่ใจว่าไม่ expose ใน client-side code

## 🚀 Performance Issues

### 1. Duplicate QR Code Dependencies
**ไฟล์**: `apps/web/package.json`
- **ปัญหา**: มี dependencies หลายตัวสำหรับ QR code:
  - `qrcode` (^1.5.3)
  - `qrcode.react` (^3.2.0)
  - `react-qr-code` (^2.0.12)
  - `qr-code-styling` (^1.9.2)
- **ผลกระทบ**: เพิ่ม bundle size
- **แก้ไข**: เลือกใช้แค่ 1-2 ตัวที่จำเป็น

### 2. Missing Code Splitting
**ปัญหา**: ไม่มี dynamic imports สำหรับ large components
- **แก้ไข**: ใช้ `next/dynamic` สำหรับ components ที่ใหญ่

### 3. Missing Caching Strategy
**ปัญหา**: ไม่มี caching สำหรับ API responses
- **แก้ไข**: เพิ่ม React Query caching หรือ Next.js caching

### 4. Image Optimization
**ปัญหา**: ต้องตรวจสอบว่าใช้ Next.js Image component ครบหรือไม่
- **แก้ไข**: ใช้ `next/image` แทน `<img>` tag

## 📊 Summary

### Security Score: 6/10
- ✅ CORS configuration (fixed)
- ✅ Security headers (added)
- ❌ Input validation (needs improvement)
- ❌ XSS protection (needs sanitization)
- ❌ Rate limiting (missing)
- ⚠️ Console logs (too many)

### Performance Score: 7/10
- ✅ Code duplication (fixed with shared-utils)
- ❌ Duplicate dependencies (needs cleanup)
- ⚠️ Code splitting (needs improvement)
- ⚠️ Caching (needs implementation)

## 🎯 Recommended Actions (Priority Order)

1. **🔴 Critical**: แก้ไข XSS vulnerabilities (dangerouslySetInnerHTML)
2. **🔴 Critical**: เพิ่ม input validation ใน supabase-proxy
3. **🟡 High**: แก้ไข alert() ให้ใช้ toast
4. **🟡 High**: เพิ่ม rate limiting
5. **🟡 High**: ลบหรือ wrap console.logs
6. **🟢 Medium**: ลบ duplicate dependencies
7. **🟢 Medium**: เพิ่ม code splitting
8. **🟢 Medium**: เพิ่ม caching strategy

