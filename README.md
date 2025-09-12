# e-BizCard - Digital Business Card Platform

แพลตฟอร์มสร้างและแชร์นามบัตรดิจิทัลที่ทันสมัย พร้อม QR Code และการติดตาม Analytics

## 🚀 Features

- **Multi-Platform**: React Native (iOS/Android) + React Web (PWA)
- **Authentication**: Email/Password + Social Login (Google, LinkedIn)
- **Business Card Management**: สร้าง/แก้ไข/ลบนามบัตรหลายใบ
- **QR Code Generation**: สร้าง QR Code สำหรับแชร์นามบัตร
- **Public Card Pages**: หน้าแสดงนามบัตรแบบ responsive
- **vCard Export**: ดาวน์โหลดเป็นไฟล์ .vcf
- **Contact Management**: บันทึกผู้ติดต่อที่สแกน QR
- **Analytics**: ติดตามการดูนามบัตร
- **Templates**: ธีมสำเร็จรูปสำหรับนามบัตร

## 🛠 Tech Stack

- **Frontend**: React Native + React (Next.js)
- **State Management**: React Query + Zustand
- **UI**: TailwindCSS + NativeWind + shadcn/ui
- **Backend**: Supabase (Auth + Database + Storage)
- **API**: Supabase Edge Functions (Node.js)
- **Deployment**: Vercel (Web) + Expo (Mobile)

## 📁 Project Structure

```
eBizCard/
├── apps/
│   ├── mobile/          # React Native App
│   ├── web/             # React Web App (PWA)
│   └── api/             # Supabase Edge Functions
├── packages/
│   ├── shared/          # Shared utilities
│   └── ui/              # Shared UI components
├── supabase/            # Database migrations & config
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm หรือ yarn
- Supabase CLI
- Expo CLI (สำหรับ mobile)

### 1. Clone Repository

```bash
git clone <repository-url>
cd eBizCard
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install mobile dependencies
cd apps/mobile
npm install

# Install web dependencies
cd ../web
npm install

# Install API dependencies
cd ../api
npm install
```

### 3. Setup Supabase

1. สร้างโปรเจกต์ใหม่ที่ [Supabase](https://supabase.com)
2. Copy environment variables:

```bash
# Copy example env files
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/web/.env.example apps/web/.env.local
```

3. ตั้งค่า environment variables:

```env
# Mobile (.env.local)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Web (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db reset
```

### 4. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy generate-qr
supabase functions deploy generate-vcard
supabase functions deploy track-view
```

### 5. Run Development Servers

```bash
# Run all apps
npm run dev

# Or run individually
cd apps/mobile && npm start
cd apps/web && npm run dev
```

## 📱 Mobile App Setup

### iOS

```bash
cd apps/mobile
npx expo run:ios
```

### Android

```bash
cd apps/mobile
npx expo run:android
```

## 🌐 Web App Setup

```bash
cd apps/web
npm run dev
```

เปิดเบราว์เซอร์ที่ `http://localhost:3000`

## 🗄 Database Schema

### Tables

- **profiles**: ข้อมูลผู้ใช้
- **business_cards**: นามบัตรดิจิทัล
- **templates**: ธีมสำเร็จรูป
- **contacts**: รายชื่อผู้ติดต่อ
- **card_views**: ข้อมูลการดูนามบัตร

### Key Features

- Row Level Security (RLS) enabled
- Automatic user profile creation
- Real-time subscriptions
- Optimized indexes

## 🔧 API Endpoints

### Edge Functions

- `generate-qr`: สร้าง QR Code
- `generate-vcard`: สร้างไฟล์ vCard
- `track-view`: ติดตามการดูนามบัตร

### Usage

```javascript
// Generate QR Code
const response = await fetch('/api/generate-qr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cardId: 'card-id' })
});

// Generate vCard
const response = await fetch('/api/generate-vcard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cardId: 'card-id' })
});
```

## 🎨 Customization

### Themes

แก้ไขธีมใน `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Customize primary colors
      }
    }
  }
}
```

### Templates

เพิ่มธีมใหม่ใน `supabase/migrations/002_insert_templates.sql`

## 📊 Analytics

ระบบจะติดตาม:
- จำนวนการดูนามบัตร
- IP address ของผู้ดู
- ข้อมูลอุปกรณ์
- เวลาที่ดู

## 🚀 Deployment

### Web App (Vercel)

1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Mobile App (Expo)

```bash
# Build for production
eas build --platform all

# Submit to stores
eas submit --platform all
```

### Supabase

```bash
# Deploy to production
supabase link --project-ref your-project-ref
supabase db push
supabase functions deploy
```

## 🔒 Security

- Row Level Security (RLS) enabled
- JWT authentication
- CORS configured
- Input validation
- Rate limiting (recommended)

## 📝 Environment Variables

### Required

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SITE_URL=your_site_url
```

### Optional

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- GitHub Issues
- Documentation
- Community Discord

---

สร้างด้วย ❤️ โดยทีม e-BizCard
