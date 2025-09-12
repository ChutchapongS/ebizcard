# e-BizCard Setup Guide

คู่มือการติดตั้งและใช้งาน e-BizCard แพลตฟอร์มนามบัตรดิจิทัล

## 📋 Prerequisites

ก่อนเริ่มต้น ตรวจสอบให้แน่ใจว่าคุณมี:

- **Node.js** 18.0.0 หรือใหม่กว่า
- **npm** หรือ **yarn** package manager
- **Git** สำหรับ clone repository
- **Supabase CLI** สำหรับจัดการ database
- **Expo CLI** สำหรับ mobile development (ถ้าต้องการรัน mobile app)

## 🚀 Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd eBizCard
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install mobile app dependencies
cd apps/mobile
npm install

# Install web app dependencies
cd ../web
npm install

# Install API dependencies
cd ../api
npm install

# Return to root
cd ../..
```

### 3. Setup Supabase Project

#### 3.1 สร้างโปรเจกต์ใหม่

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. คลิก "New Project"
3. เลือก Organization และตั้งชื่อโปรเจกต์
4. ตั้งค่า Database Password
5. เลือก Region (แนะนำ Singapore สำหรับประเทศไทย)
6. คลิก "Create new project"

#### 3.2 ตั้งค่า Authentication

1. ไปที่ **Authentication > Providers**
2. เปิดใช้งาน **Email** provider
3. เปิดใช้งาน **Google** provider:
   - ไปที่ [Google Cloud Console](https://console.cloud.google.com)
   - สร้าง OAuth 2.0 Client ID
   - เพิ่ม authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID และ Client Secret ไปใส่ใน Supabase
4. เปิดใช้งาน **LinkedIn** provider (ถ้าต้องการ):
   - ไปที่ [LinkedIn Developer Portal](https://www.linkedin.com/developers)
   - สร้าง App
   - เพิ่ม authorized redirect URIs
   - Copy Client ID และ Client Secret

#### 3.3 ตั้งค่า Database

1. ไปที่ **SQL Editor**
2. Copy เนื้อหาจาก `supabase/migrations/001_initial_schema.sql`
3. Paste และรัน SQL script
4. Copy เนื้อหาจาก `supabase/migrations/002_insert_templates.sql`
5. Paste และรัน SQL script

#### 3.4 ตั้งค่า Edge Functions

1. ไปที่ **Edge Functions**
2. Deploy functions:
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Link to your project
   supabase link --project-ref your-project-ref

   # Deploy functions
   supabase functions deploy generate-qr
   supabase functions deploy generate-vcard
   supabase functions deploy track-view
   ```

### 4. Environment Variables

#### 4.1 Mobile App

```bash
cd apps/mobile
cp env.example .env.local
```

แก้ไข `.env.local`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_SITE_URL=https://your-domain.com
```

#### 4.2 Web App

```bash
cd apps/web
cp env.example .env.local
```

แก้ไข `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 5. Run Development Servers

#### 5.1 Web App

```bash
cd apps/web
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

#### 5.2 Mobile App

```bash
cd apps/mobile
npm start
```

ใช้ Expo Go app สแกน QR code หรือรันบน simulator

### 6. Test the Application

1. **Register/Login**: สร้างบัญชีใหม่หรือเข้าสู่ระบบ
2. **Create Card**: สร้างนามบัตรดิจิทัล
3. **Generate QR**: สร้าง QR Code สำหรับแชร์
4. **View Public Page**: เปิดลิงก์สาธารณะของนามบัตร
5. **Download vCard**: ดาวน์โหลดเป็นไฟล์ contact

## 🔧 Troubleshooting

### Common Issues

#### 1. Supabase Connection Error

**ปัญหา**: ไม่สามารถเชื่อมต่อ Supabase ได้

**วิธีแก้**:
- ตรวจสอบ environment variables
- ตรวจสอบ Supabase URL และ API key
- ตรวจสอบ network connection

#### 2. Authentication Error

**ปัญหา**: ไม่สามารถเข้าสู่ระบบได้

**วิธีแก้**:
- ตรวจสอบ Supabase Auth settings
- ตรวจสอบ OAuth provider configuration
- ตรวจสอบ redirect URLs

#### 3. Database Error

**ปัญหา**: ไม่สามารถเข้าถึง database ได้

**วิธีแก้**:
- ตรวจสอบ RLS policies
- ตรวจสอบ table permissions
- ตรวจสอบ migration scripts

#### 4. Mobile App Build Error

**ปัญหา**: ไม่สามารถ build mobile app ได้

**วิธีแก้**:
- ตรวจสอบ Expo CLI version
- ตรวจสอบ Node.js version
- Clear cache: `expo r -c`

### Debug Mode

เปิด debug mode สำหรับ troubleshooting:

```bash
# Web app
cd apps/web
DEBUG=* npm run dev

# Mobile app
cd apps/mobile
EXPO_DEBUG=1 npm start
```

## 📱 Mobile App Specific Setup

### iOS Development

1. Install Xcode
2. Install iOS Simulator
3. Run: `npx expo run:ios`

### Android Development

1. Install Android Studio
2. Setup Android SDK
3. Create Android Virtual Device
4. Run: `npx expo run:android`

### Physical Device

1. Install Expo Go app
2. Scan QR code จาก development server
3. App จะเปิดใน Expo Go

## 🌐 Web App Specific Setup

### PWA Configuration

1. ตรวจสอบ `next.config.js`
2. ตรวจสอบ `manifest.json`
3. ตรวจสอบ service worker

### Deployment

1. **Vercel** (แนะนำ):
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   ```bash
   npm run build
   # Upload dist folder to Netlify
   ```

## 🔒 Security Considerations

### Production Setup

1. **Environment Variables**:
   - ใช้ environment variables สำหรับ sensitive data
   - ไม่ commit `.env` files
   - ใช้ secure key management

2. **Database Security**:
   - เปิดใช้งาน RLS
   - ตั้งค่า proper policies
   - ใช้ service role key เฉพาะที่จำเป็น

3. **API Security**:
   - ตั้งค่า CORS properly
   - ใช้ rate limiting
   - Validate input data

## 📊 Monitoring & Analytics

### Supabase Dashboard

1. ไปที่ **Logs** เพื่อดู API calls
2. ไปที่ **Database** เพื่อดู queries
3. ไปที่ **Auth** เพื่อดู user activity

### Custom Analytics

1. ใช้ `card_views` table สำหรับ tracking
2. สร้าง dashboard ใน Supabase
3. Export data สำหรับ analysis

## 🆘 Getting Help

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs)

### Community

- GitHub Issues
- Supabase Discord
- Expo Discord
- Stack Overflow

---

หากมีปัญหาหรือคำถาม สามารถเปิด issue ใน GitHub repository ได้เลยครับ! 🚀
