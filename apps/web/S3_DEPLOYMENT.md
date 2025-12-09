# คำแนะนำการ Deploy บน AWS S3

เอกสารนี้จะแนะนำวิธีการ deploy Next.js static export ไปยัง AWS S3

## 📋 สิ่งที่ต้องเตรียม

1. **AWS Account** - สร้างบัญชี AWS (ถ้ายังไม่มี)
2. **AWS CLI** - ติดตั้ง AWS CLI
3. **AWS Credentials** - ตั้งค่า credentials สำหรับ AWS CLI

## 🔧 การติดตั้ง AWS CLI

### Windows
```powershell
# ดาวน์โหลดและติดตั้งจาก
# https://aws.amazon.com/cli/
```

### macOS
```bash
brew install awscli
```

### Linux
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

## 🔐 การตั้งค่า AWS Credentials

```bash
aws configure
```

กรอกข้อมูล:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (แนะนำ: `ap-southeast-1` สำหรับประเทศไทย)
- Default output format (แนะนำ: `json`)

## 📦 ขั้นตอนการ Deploy

### 1. Build Static Export

```bash
cd apps/web
npm run build:s3
```

คำสั่งนี้จะ:
- ตั้งค่า `NEXT_STATIC_EXPORT=true`
- Build Next.js เป็น static files
- เก็บผลลัพธ์ในโฟลเดอร์ `out/`

**หมายเหตุ**: ตรวจสอบว่า build สำเร็จโดยไม่มี error ก่อน deploy

### 2. สร้าง S3 Bucket

#### วิธีที่ 1: ใช้ AWS Console
1. ไปที่ [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. คลิก "Create bucket"
3. ตั้งชื่อ bucket (ต้อง unique ทั่วโลก)
4. เลือก region (แนะนำ: `ap-southeast-1`)
5. ปิด "Block all public access" (ถ้าต้องการให้เข้าถึงได้)
6. คลิก "Create bucket"

#### วิธีที่ 2: ใช้ AWS CLI
```bash
aws s3 mb s3://your-bucket-name --region ap-southeast-1
```

### 3. Deploy ไปยัง S3

#### Windows (PowerShell)
```powershell
cd apps/web
.\scripts\deploy-s3.ps1 -BucketName "your-bucket-name" -Region "ap-southeast-1"
```

#### Linux/macOS (Bash)
```bash
cd apps/web
chmod +x scripts/deploy-s3.sh
./scripts/deploy-s3.sh your-bucket-name ap-southeast-1
```

### 4. ตั้งค่า Bucket Policy (สำหรับ Public Access)

แก้ไขไฟล์ `scripts/s3-bucket-policy.json`:
- แทนที่ `YOUR_BUCKET_NAME` ด้วยชื่อ bucket ของคุณ

จากนั้นรันคำสั่ง:
```bash
aws s3api put-bucket-policy \
  --bucket your-bucket-name \
  --policy file://apps/web/scripts/s3-bucket-policy.json
```

### 5. ตั้งค่า CORS (ถ้าจำเป็น)

```bash
aws s3api put-bucket-cors \
  --bucket your-bucket-name \
  --cors-configuration file://apps/web/scripts/s3-cors-config.json
```

### 6. เปิดใช้งาน Static Website Hosting

Script จะตั้งค่าให้อัตโนมัติ แต่ถ้าต้องการตั้งค่าด้วยตนเอง:

```bash
aws s3 website s3://your-bucket-name/ \
  --index-document index.html \
  --error-document 404.html
```

## 🌐 การเข้าถึง Website

หลังจาก deploy แล้ว คุณสามารถเข้าถึง website ได้ที่:

```
http://your-bucket-name.s3-website-ap-southeast-1.amazonaws.com
```

## 🚀 ขั้นตอนต่อไป (แนะนำ)

### 1. ตั้งค่า CloudFront (สำหรับ HTTPS และ Custom Domain)

1. ไปที่ [AWS CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. คลิก "Create Distribution"
3. ตั้งค่า:
   - **Origin Domain**: `your-bucket-name.s3-website-ap-southeast-1.amazonaws.com`
   - **Origin Protocol**: HTTP
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Default Root Object**: `index.html`
4. คลิก "Create Distribution"

### 2. ตั้งค่า Custom Domain

1. ใน CloudFront distribution settings
2. ไปที่ "Alternate Domain Names (CNAMEs)"
3. เพิ่ม domain ของคุณ
4. ตั้งค่า SSL certificate (ใช้ AWS Certificate Manager)

### 3. ตั้งค่า Error Pages

ใน CloudFront:
- **404 Error**: Redirect to `/404.html` with 404 status code
- **403 Error**: Redirect to `/404.html` with 404 status code

**หมายเหตุ**: ไฟล์ `404.html` ถูกสร้างไว้ใน `public/404.html` และจะถูก copy ไปยัง `out/` directory เมื่อ build

## ⚠️ ข้อจำกัดของ Static Export

เมื่อใช้ static export บน S3:

1. **API Routes ไม่ทำงาน** - Next.js API routes (`/api/*`) จะไม่ทำงาน
   - **วิธีแก้**: ใช้ Supabase Edge Functions หรือ external API แทน (ทำแล้วใน `src/lib/api-client.ts`)

2. **Server-Side Rendering (SSR) ไม่ทำงาน** - ต้องใช้ Client-Side Rendering
   - โค้ดส่วนใหญ่ใช้ `'use client'` อยู่แล้ว ✅

3. **Dynamic Routes** - ต้องใช้ `generateStaticParams` หรือ client-side routing
   - ตรวจสอบว่า dynamic routes ทำงานได้ถูกต้อง
   - `/card/[id]` ใช้ `generateStaticParams()` และ client-side routing ✅

4. **Environment Variables** - ต้องเป็น `NEXT_PUBLIC_*` เพื่อให้ใช้ได้ใน client-side
   - ตรวจสอบว่า environment variables ทั้งหมดเป็น `NEXT_PUBLIC_*` ✅

5. **Images** - ต้องใช้ `unoptimized: true` สำหรับ static export
   - ตั้งค่าใน `next.config.js` แล้ว ✅

6. **404 Handling** - ต้องมี `404.html` สำหรับ S3 static website hosting
   - สร้างไฟล์ `public/404.html` แล้ว ✅
   - สร้าง `not-found.tsx` สำหรับ Next.js 404 page แล้ว ✅

## 🔄 การ Update Website

เมื่อต้องการ update website:

```bash
cd apps/web
npm run build:s3
# จากนั้น deploy อีกครั้งด้วย script เดิม
```

## 🛠️ Troubleshooting

### ปัญหา: Build Error - Missing generateStaticParams()

**อาการ**: `Error: Page "/card/[id]" is missing "generateStaticParams()"`

**วิธีแก้**: ตรวจสอบว่า `apps/web/src/app/card/[id]/page.tsx` มี `generateStaticParams()` ที่ return `[]`

### ปัญหา: Bucket ไม่สามารถเข้าถึงได้
- ตรวจสอบ Bucket Policy ว่าตั้งค่าถูกต้อง
- ตรวจสอบว่า "Block all public access" ถูกปิด

### ปัญหา: 404 Error เมื่อเข้าถึง sub-pages
- ตรวจสอบว่า CloudFront Error Pages ตั้งค่าถูกต้อง
- ตรวจสอบว่า S3 website hosting เปิดใช้งาน
- ตรวจสอบว่า `404.html` ถูก deploy ไปยัง S3

### ปัญหา: API calls ไม่ทำงาน
- ตรวจสอบว่า API endpoints ถูกย้ายไปใช้ Supabase Edge Functions หรือ external API
- ตรวจสอบ CORS settings
- ตรวจสอบว่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ถูกตั้งค่า

### ปัญหา: Images ไม่แสดง
- ตรวจสอบว่า `images.unoptimized: true` ถูกตั้งค่าใน `next.config.js`
- ตรวจสอบว่า image URLs ถูกต้อง

## 📝 ไฟล์ที่สำคัญ

- `apps/web/public/404.html` - 404 page สำหรับ S3 static website hosting
- `apps/web/src/app/not-found.tsx` - Next.js 404 page component
- `apps/web/src/app/card/[id]/page.tsx` - Dynamic route ที่ใช้ `generateStaticParams()`
- `apps/web/src/lib/api-client.ts` - API client ที่ใช้ Supabase Edge Functions
- `apps/web/next.config.js` - Next.js configuration สำหรับ static export
- `apps/web/scripts/deploy-s3.ps1` - PowerShell script สำหรับ deploy
- `apps/web/scripts/deploy-s3.sh` - Bash script สำหรับ deploy
- `apps/web/scripts/s3-bucket-policy.json` - S3 bucket policy template
- `apps/web/scripts/s3-cors-config.json` - S3 CORS configuration

## 📚 เอกสารเพิ่มเติม

- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [AWS S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)

