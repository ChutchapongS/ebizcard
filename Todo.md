TODO List: ปรับโปรเจกต์ให้รองรับ AWS S3 Static Export
1. ตรวจสอบรายละเอียดว่าโค้ดส่วนไหนต้องแก้ไข
สรุปผลการตรวจสอบ:
A. API Routes (37 routes) — ต้องย้ายทั้งหมด
ไฟล์ทั้งหมดใน apps/web/src/app/api/
ใช้ NextRequest, NextResponse จาก next/server
บางไฟล์ใช้ cookies() จาก next/headers:
update-addresses/route.ts
upload-profile/route.ts
upload-company-logo/route.ts
delete-account/route.ts
lib/supabase/server.ts
B. Middleware — ต้องลบหรือแก้ไข
apps/web/src/middleware.ts ใช้ NextRequest, NextResponse
Static export ไม่รองรับ middleware
C. Server Components — ต้องตรวจสอบ
apps/web/src/app/layout.tsx — Server Component (ใช้ metadata)
ต้องเปลี่ยนเป็น Client Component หรือใช้ Static Generation
D. Next.js Config — ต้องแก้ไข
async headers() — ไม่รองรับใน static export
async redirects() — จำกัดใน static export (redirect แบบ cookie ไม่ได้)
images.domains — ต้องเปลี่ยนเป็น images.remotePatterns สำหรับ static export
E. Pages ที่ใช้ 'use client' — OK
18 ไฟล์ใช้ 'use client' แล้ว (ไม่ต้องแก้)
2. แก้ไข next.config.js ให้รองรับ static export
การเปลี่ยนแปลงที่ต้องทำ:
/** @type {import('next').NextConfig} */const envVars = {  CUSTOM_KEY: process.env.CUSTOM_KEY || '',};const buildOutput = process.env.NEXT_BUILD_OUTPUT;const enableStandalone = buildOutput === 'standalone';const enableStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';const nextConfig = {  // เพิ่ม static export  ...(enableStaticExport ? { output: 'export' } : {}),    // แก้ไข images config สำหรับ static export  images: enableStaticExport ? {    unoptimized: true, // ต้องใช้ unoptimized ใน static export  } : {    remotePatterns: [      {        protocol: 'https',        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname          : '',      },      {        protocol: 'https',        hostname: 'lh3.googleusercontent.com',      },      {        protocol: 'https',        hostname: 'media.licdn.com',      },    ].filter(p => p.hostname),  },    // ลบ standalone output ถ้าใช้ static export  ...(enableStandalone && !enableStaticExport ? { output: 'standalone' } : {}),    trailingSlash: false,  env: envVars,    webpack: (config, { isServer, webpack }) => {    // ... existing webpack config ...  },    // ลบหรือเงื่อนไข headers() สำหรับ static export  ...(enableStaticExport ? {} : {    async headers() {      // ... existing headers config ...    },  }),    // แก้ไข redirects() สำหรับ static export (ลบ cookie-based redirect)  async redirects() {    if (enableStaticExport) {      // Static export รองรับเฉพาะ static redirects      return [];    }    return [      {        source: '/',        destination: '/dashboard',        permanent: false,        has: [          {            type: 'cookie',            key: 'sb-access-token',          },        ],      },    ];  },};module.exports = nextConfig;
3. แนะนำวิธีย้าย API Routes ไป Supabase Edge Functions
ขั้นตอนการย้าย:
A. สร้างโครงสร้าง Edge Functions
supabase/  functions/    api/      get-profile/        index.ts      update-profile/        index.ts      generate-vcard/        index.ts      ... (ย้าย API routes ทั้งหมด)
B. Template สำหรับ Edge Function:
// supabase/functions/api/get-profile/index.tsimport { serve } from 'https://deno.land/std@0.168.0/http/server.ts'import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'const corsHeaders = {  'Access-Control-Allow-Origin': '*',  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',}serve(async (req) => {  // Handle CORS  if (req.method === 'OPTIONS') {    return new Response('ok', { headers: corsHeaders })  }  try {    // Get authorization header    const authHeader = req.headers.get('Authorization')    if (!authHeader) {      return new Response(        JSON.stringify({ error: 'Missing authorization header' }),        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }      )    }    // Create Supabase client    const supabaseUrl = Deno.env.get('SUPABASE_URL')!    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!    const supabase = createClient(supabaseUrl, supabaseKey, {      global: {        headers: { Authorization: authHeader },      },    })    // Your API logic here    // ... (copy from existing route.ts)    return new Response(      JSON.stringify({ success: true, data: result }),      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }    )  } catch (error) {    return new Response(      JSON.stringify({ error: error.message }),      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }    )  }})
C. อัปเดต Client Code:
เปลี่ยนจาก:
fetch('/api/get-profile', { ... })
เป็น:
const SUPABASE_FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`fetch(`${SUPABASE_FUNCTIONS_URL}/api/get-profile`, { ... })
D. Environment Variables:
เพิ่มใน .env:
NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://your-project.supabase.co/functions/v1
สรุปลำดับการทำงาน
แก้ไข next.config.js เพิ่ม static export config
ลบหรือ comment middleware.ts
แก้ไข layout.tsx ให้รองรับ static export
ย้าย API routes ไป Supabase Edge Functions (ทีละ route)
อัปเดต client code ให้เรียก Edge Functions
ทดสอบ build: NEXT_STATIC_EXPORT=true npm run build
ทดสอบ export: npm run export
ต้องการให้เริ่มจากส่วนไหนก่อน? แนะนำให้เริ่มจากข้อ 1 (แก้ไข next.config.js) ก่อน