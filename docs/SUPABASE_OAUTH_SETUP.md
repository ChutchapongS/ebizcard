# Supabase OAuth Setup Guide

## Google OAuth Setup

### 1. เปิดใช้งาน Google Provider ใน Supabase

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ **Authentication** > **Providers**
4. เปิดใช้งาน **Google** provider

### 2. ตั้งค่า Google OAuth Credentials

#### 2.1 สร้าง Google OAuth App

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มีอยู่
3. เปิดใช้งาน **Google Identity** (ไม่ต้องหา API แยก)

#### 2.2 สร้าง OAuth 2.0 Client ID

1. ไปที่ **APIs & Services** > **Credentials**
2. คลิก **Create Credentials** > **OAuth 2.0 Client ID**
3. เลือก **Web application**
4. ตั้งค่า **Authorized redirect URIs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. คัดลอก **Client ID** และ **Client Secret**

#### 2.3 ตั้งค่าใน Supabase

1. กลับไปที่ Supabase Dashboard
2. ไปที่ **Authentication** > **Providers** > **Google**
3. ใส่ข้อมูล:
   - **Client ID**: จาก Google Cloud Console
   - **Client Secret**: จาก Google Cloud Console
4. ตั้งค่า **Redirect URL**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. คลิก **Save**

### 3. ตั้งค่า Environment Variables

เพิ่มในไฟล์ `.env.local`:

```env
# Google OAuth (Optional - for server-side operations)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## LinkedIn OAuth Setup

### 1. เปิดใช้งาน LinkedIn Provider ใน Supabase

1. ไปที่ **Authentication** > **Providers**
2. เปิดใช้งาน **LinkedIn** provider

### 2. ตั้งค่า LinkedIn OAuth Credentials

#### 2.1 สร้าง LinkedIn App

1. ไปที่ [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. คลิก **Create App**
3. กรอกข้อมูล:
   - **App Name**: e-BizCard
   - **LinkedIn Page**: เลือกหน้า LinkedIn ของคุณ
   - **Privacy Policy URL**: `https://your-domain.com/privacy`
   - **App Logo**: อัปโหลดโลโก้

#### 2.2 ตั้งค่า OAuth 2.0

1. ไปที่ **Auth** tab
2. ตั้งค่า **Redirect URLs**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. เลือก **Scopes**:
   - `r_liteprofile`
   - `r_emailaddress`
4. คัดลอก **Client ID** และ **Client Secret**

#### 2.3 ตั้งค่าใน Supabase

1. กลับไปที่ Supabase Dashboard
2. ไปที่ **Authentication** > **Providers** > **LinkedIn**
3. ใส่ข้อมูล:
   - **Client ID**: จาก LinkedIn Developer Portal
   - **Client Secret**: จาก LinkedIn Developer Portal
4. ตั้งค่า **Redirect URL**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. คลิก **Save**

### 3. ตั้งค่า Environment Variables

เพิ่มในไฟล์ `.env.local`:

```env
# LinkedIn OAuth (Optional - for server-side operations)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

## Testing OAuth

### 1. ทดสอบ Google OAuth

1. ไปที่หน้า login
2. คลิกปุ่ม **Google**
3. ควรจะ redirect ไป Google OAuth page
4. หลังจาก login สำเร็จ ควรจะกลับมาที่ `/dashboard`

### 2. ทดสอบ LinkedIn OAuth

1. ไปที่หน้า login
2. คลิกปุ่ม **LinkedIn**
3. ควรจะ redirect ไป LinkedIn OAuth page
4. หลังจาก login สำเร็จ ควรจะกลับมาที่ `/dashboard`

## Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. "provider is not enabled" Error

**สาเหตุ**: OAuth provider ยังไม่ได้เปิดใช้งานใน Supabase

**วิธีแก้ไข**:
1. ไปที่ Supabase Dashboard
2. เปิดใช้งาน provider ที่ต้องการ
3. ตั้งค่า credentials ให้ถูกต้อง

#### 2. "redirect_uri_mismatch" Error

**สาเหตุ**: Redirect URI ไม่ตรงกับที่ตั้งค่าใน OAuth app

**วิธีแก้ไข**:
1. ตรวจสอบ Redirect URI ใน OAuth app
2. ต้องเป็น: `https://your-project.supabase.co/auth/v1/callback`

#### 3. "invalid_client" Error

**สาเหตุ**: Client ID หรือ Client Secret ผิด

**วิธีแก้ไข**:
1. ตรวจสอบ Client ID และ Client Secret
2. ตรวจสอบว่า app ยัง active อยู่

#### 4. "access_denied" Error

**สาเหตุ**: User ปฏิเสธการให้สิทธิ์

**วิธีแก้ไข**:
1. ตรวจสอบ scopes ที่ขอ
2. ตรวจสอบ privacy policy และ terms of service

## Security Best Practices

### 1. Environment Variables

- เก็บ Client Secret ใน environment variables เท่านั้น
- อย่า commit `.env.local` ลง git
- ใช้ `.env.example` สำหรับ template

### 2. Redirect URLs

- ตั้งค่าเฉพาะ domain ที่อนุญาต
- ใช้ HTTPS เสมอ
- ตรวจสอบ URL ให้ถูกต้อง

### 3. Scopes

- ขอเฉพาะ scopes ที่จำเป็น
- อธิบายให้ user เข้าใจว่าขอข้อมูลอะไร
- ใช้ least privilege principle

## Production Deployment

### 1. ตั้งค่า Production URLs

1. ไปที่ OAuth app settings
2. เพิ่ม production redirect URLs:
   ```
   https://your-production-domain.com/auth/v1/callback
   ```

### 2. ตั้งค่า Environment Variables

```env
# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### 3. ตรวจสอบ Security

- เปิดใช้งาน Row Level Security (RLS)
- ตั้งค่า CORS ให้ถูกต้อง
- ใช้ HTTPS เสมอ

---

สำหรับคำถามเพิ่มเติม กรุณาติดต่อทีมพัฒนา e-BizCard
