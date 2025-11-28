# คู่มือการทำงานของ SCGJWD User Portal Integration

## 📋 ภาพรวม

ระบบนี้รองรับการเข้าสู่ระบบผ่าน SCGJWD User Portal ซึ่งเป็นระบบ Single Sign-On (SSO) สำหรับพนักงานภายในบริษัท โดยใช้ Azure AD เป็น authentication provider

## 🔄 Flow การทำงาน

### วิธีที่ 1: เข้าเว็บตรง → กดปุ่ม SCGJWD User Portal

```
1. ผู้ใช้เข้าเว็บ e-BizCard
2. กดปุ่ม "SCGJWD User Portal" (สีส้ม)
3. Redirect ไปที่ User Portal (`/login?client_id=e-BizCard&redirect_uri=https://your-app/auth/callback?returnUrl=%2Fdashboard`)
4. Login ผ่าน Azure AD ที่ User Portal
5. User Portal redirect กลับมาที่ `/auth/callback?code=<authorization_code>`
6. React เรียก Supabase Edge Function `/functions/v1/user-portal-login` พร้อม `code`
7. Edge Function สร้าง/อัปเดตผู้ใช้ + session แล้ว React redirect ไปที่ `/dashboard`
```

### วิธีที่ 2: ไปหน้า User Portal → กดปุ่มเว็บย่อย

```
1. ผู้ใช้ไปที่ User Portal
2. Login ผ่าน Azure AD ที่ User Portal
3. กดปุ่ม "e-BizCard" (หรือชื่อเว็บย่อย)
4. User Portal redirect ไปที่ `/auth/callback?code=...`
5. React เรียก Supabase Edge Function `/functions/v1/user-portal-login`
6. Edge Function สร้าง/อัปเดตผู้ใช้ + session แล้ว React redirect ไปที่ `/dashboard`
```

### Logout Flow

```
1. ผู้ใช้กดปุ่มออกจากระบบใน e-BizCard
2. e-BizCard เคลียร์ Supabase session / local storage
3. e-BizCard redirect ไปที่ User Portal
   /logout?client_id=e-BizCard&return_uri=https://your-app.com/auth/login
4. User Portal clearSession() ฝั่ง SSO
5. User Portal redirect กลับมายัง return_uri
6. หน้า `/auth/login` แสดงแบบฟอร์มเข้าสู่ระบบอีกครั้ง
```

## 🔧 การตั้งค่า

### 1. Environment Variables

#### Web App (`.env.local`):

```env
# SCGJWD User Portal (Public - สำหรับ redirect)
NEXT_PUBLIC_USER_PORTAL_URL=https://user-portal.example.com
NEXT_PUBLIC_USER_PORTAL_CLIENT_ID=e-BizCard

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

#### Supabase Edge Functions (ตั้งค่าใน Supabase Dashboard):

ไปที่ **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

เพิ่ม environment variables ต่อไปนี้:

```env
# User Portal Configuration (Server-side only)
USER_PORTAL_TOKEN_URL=https://user-portal.example.com/api/auth/token
# หรือ https://user-portal.example.com/oauth/token
USER_PORTAL_PROFILE_URL=https://user-portal.example.com/api/user/getprofile
USER_PORTAL_CLIENT_ID=e-BizCard
USER_PORTAL_CLIENT_SECRET=your_user_portal_client_secret

# Supabase Service Role Key (มีอยู่แล้วใน Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**หมายเหตุ:**
- `USER_PORTAL_CLIENT_SECRET` และ `SUPABASE_SERVICE_ROLE_KEY` ต้องเก็บเป็นความลับ
- ตั้งค่าใน Supabase Dashboard เท่านั้น ไม่ต้องใส่ใน `.env.local`

สำหรับ Mobile (`apps/mobile/.env`):

```env
EXPO_PUBLIC_USER_PORTAL_URL=https://user-portal.example.com
EXPO_PUBLIC_USER_PORTAL_CLIENT_ID=e-BizCard
```

### 2. Deploy Supabase Edge Function

Deploy Edge Function สำหรับ User Portal login:

```bash
# ติดตั้ง Supabase CLI (ถ้ายังไม่มี)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy Edge Function
supabase functions deploy user-portal-login
```

**หรือใช้ Supabase Dashboard:**
1. ไปที่ **Edge Functions** ใน Supabase Dashboard
2. Upload ไฟล์ `apps/web/supabase/functions/user-portal-login/index.ts`
3. ตั้งค่า environment variables ตามขั้นตอนที่ 1

### 3. User Portal Configuration

User Portal ต้องรองรับการเรียก (ฝั่งเว็บ):

```
https://user-portal.example.com/login?client_id=e-BizCard&redirect_uri=https%3A%2F%2Fyour-app.com%2Fauth%2Fcallback%3FreturnUrl%3D%252Fdashboard
```

หลังจากผู้ใช้ login สำเร็จ ให้ redirect กลับมาที่:

```
https://your-app.com/auth/callback?code=<authorization_code>&returnUrl=<encoded_url> (optional)
```



**Parameters:**
- `code`: Authorization code (ต้องแลกเป็น token ต่อ)
- `returnUrl`: URL ปลายทางหลังสร้าง session (ดีฟอลต์ `/dashboard`)
- `error`: Error message (ถ้ามี)

## 📁 ไฟล์ที่เกี่ยวข้อง

### Web App

1. **`apps/web/src/app/auth/login/page.tsx`**
   - หน้า login ที่มีปุ่ม "SCGJWD User Portal"
   - Function `handleSCGJWDLogin()` redirect ไปที่ User Portal

2. **`apps/web/src/app/auth/callback/page.tsx`**
   - รับ `code` และ `returnUrl`
   - เรียก Supabase Edge Function `/functions/v1/user-portal-login`
   - ใช้ `supabase.auth.setSession()` เพื่อตั้งค่า session แล้ว redirect

3. **`apps/web/src/app/home/page.tsx`**
   - Legacy route ที่ re-export หน้า Landing (`app/page.tsx`) เพื่อความเข้ากันได้เดิม

4. **`apps/web/supabase/functions/user-portal-login/index.ts`**
   - Supabase Edge Function สำหรับแลก authorization code กับ User Portal
   - ทำหน้าที่: Exchange code → Get profile → Create/Update user → Create session
   - มี role mapping (department `IT` ⇒ `admin`, ค่าอื่นเป็น `user`)
   - ใช้ server env (`USER_PORTAL_*`, `SUPABASE_SERVICE_ROLE_KEY`)
   
5. **`apps/web/env.example`**
   - ตัวอย่าง environment variables
   - มี `NEXT_PUBLIC_USER_PORTAL_URL`

6. **`apps/web/src/lib/auth-context.tsx`**
   - จัดการ session ของ Supabase
   - Sync `user_metadata` (role / department) ลง localStorage และ handle logout → User Portal

### Mobile App

https://test-user-portal.scgjwd.com/api/auth/token

1. **`apps/mobile/src/screens/auth/LoginScreen.tsx`**
   - หน้า login mobile ที่มีปุ่ม "SCGJWD User Portal"
   - ใช้ `Linking.openURL()` เพื่อเปิด User Portal ใน browser

## 🔐 Token Exchange Format

**Supabase Edge Function** `/functions/v1/user-portal-login` ทำงานอัตโนมัติ:

1. **Exchange Code → Token**: ส่งคำขอไปยัง `USER_PORTAL_TOKEN_URL` ด้วย **POST request** และ **Content-Type: application/x-www-form-urlencoded**

**Request Headers:**
```
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

**Request Body (form-urlencoded):**
```
client_id=e-BizCard
&client_secret=...
&code=<authorization_code>
&redirect_uri=https://your-app.com/auth/callback
&grant_type=authorization_code
```

และคาดหวังการตอบกลับในรูปแบบ OAuth มาตรฐาน:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## 🛠️ การปรับแต่ง

### เพิ่มการตรวจสอบ / Logging เพิ่มเติม

ใน callback page สามารถเพิ่ม:

- ตรวจสอบ scope / permission ที่แนบมากับ token
- ตรวจสอบ timestamp เพื่อป้องกัน replay attack
- Log audit trail เมื่อมีการเข้าสู่ระบบผ่าน User Portal

## 📱 Mobile App

สำหรับ mobile app ใช้ deep linking (ยังคงใช้ `/auth/callback` หรือเส้นทางที่กำหนดเอง):

```typescript
const appReturnUrl = 'ebizcard://dashboard';
const callbackUri = `ebizcard://auth/callback?returnUrl=${encodeURIComponent(appReturnUrl)}`;

// User Portal redirect -> ebizcard://auth/callback?code=xxx&returnUrl=...
```

## 🔍 Troubleshooting

### ปัญหา: ไม่สามารถแลก authorization code ได้

**อาการ:** แสดง error "ไม่สามารถแลก authorization code ได้" เมื่อ redirect กลับมาจาก User Portal

**ตรวจสอบ:**
1. เปิด Browser Console (F12) ดู error logs
2. ตรวจสอบว่า environment variables ตั้งค่าใน `.env.local`:
   ```env
   USER_PORTAL_TOKEN_URL=https://user-portal.example.com/oauth/token
   USER_PORTAL_CLIENT_ID=e-BizCard
   USER_PORTAL_PROFILE_URL=https://user-portal.example.com/api/user/getprofile
   USER_PORTAL_CLIENT_SECRET=your_user_portal_client_secret
   ```
3. ตรวจสอบว่า variables เป็น **server-side only** (ไม่มี `NEXT_PUBLIC_` prefix)
4. Restart Next.js dev server หลังจากเพิ่ม environment variables
5. ตรวจสอบว่า User Portal token endpoint ทำงานได้ (ลองเรียก API ด้วย curl หรือ Postman)
6. ตรวจสอบว่า `client_id`, `client_secret`, และ `redirect_uri` ตรงกับที่ตั้งค่าไว้ใน User Portal

**ถ้าเห็น error "405 Not Allowed":**
- ตรวจสอบว่า `USER_PORTAL_TOKEN_URL` ถูกต้องและรองรับ POST method
- ลองทดสอบ endpoint ด้วย curl:
  ```bash
  curl -X POST "https://user-portal.example.com/oauth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=e-BizCard&client_secret=...&code=...&redirect_uri=...&grant_type=authorization_code"
  ```
- ตรวจสอบ User Portal documentation ว่า token endpoint ต้องการ method และ Content-Type อะไร

**การแก้ไข:**
```bash
# 1. ตรวจสอบว่าไฟล์ .env.local มีอยู่
ls -la apps/web/.env.local

# 2. ตรวจสอบว่า environment variables ถูกตั้งค่า
cat apps/web/.env.local | grep USER_PORTAL

# 3. Restart dev server
npm run dev
```

### ปัญหา: Redirect ไม่ทำงาน

**ตรวจสอบ:**
1. `NEXT_PUBLIC_USER_PORTAL_URL` ตั้งค่าถูกต้องหรือไม่
2. User Portal รับ `callbackUrl` และ `returnUrl` หรือไม่
3. CORS settings ใน User Portal

### ปัญหา: Logout แล้ว SSO ยังคงค้างอยู่

**ตรวจสอบ:**
1. `NEXT_PUBLIC_USER_PORTAL_URL` ตั้งค่าแล้วหรือไม่
2. User Portal รองรับ `/logout?client_id=...&return_uri=...` หรือไม่
3. Return URI (`/auth/login`) อยู่ใน allowlist ของ User Portal หรือไม่

### ปัญหา: Token ไม่ถูกต้อง

**ตรวจสอบ:**
1. Token format ที่ User Portal ส่งมา
2. Token expiration
3. Token signature verification

### ปัญหา: Session ไม่ถูกสร้าง

**ตรวจสอบ:**
1. Supabase configuration
2. Token format compatibility
3. Network requests ใน browser console
4. ตรวจสอบว่า token จาก User Portal เป็น Supabase-compatible format หรือไม่

## 📝 หมายเหตุ

- User Portal ต้องรองรับ CORS สำหรับ callback URL
- Token ควรมี expiration time ที่เหมาะสม
- ควรมี error handling สำหรับกรณี token หมดอายุ
- ควรมี fallback mechanism ถ้า User Portal ไม่สามารถใช้งานได้

## 🔗 Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Azure AD OAuth 2.0](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)

