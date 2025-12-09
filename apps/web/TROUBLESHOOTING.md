# Troubleshooting Guide

## Error: "Failed to fetch" เมื่อเรียก Edge Functions

### สาเหตุที่เป็นไปได้:

1. **Edge Function ยังไม่ได้ deploy**
   - ตรวจสอบว่า Edge Function ถูก deploy แล้วใน Supabase Dashboard
   - Deploy ด้วยคำสั่ง: `npm run deploy:functions`

2. **CORS Issue**
   - ตรวจสอบว่า Edge Function มี CORS headers ถูกต้อง
   - ตรวจสอบว่า `corsHeaders` ถูก import และใช้ใน Edge Function

3. **URL ไม่ถูกต้อง**
   - ตรวจสอบว่า `NEXT_PUBLIC_SUPABASE_URL` ถูกตั้งค่าใน `.env.local`
   - URL ควรเป็น: `https://<project-ref>.supabase.co`

4. **Authentication Issue**
   - ตรวจสอบว่า user มี session และ access token
   - ตรวจสอบว่า Authorization header ถูกส่งไป

### วิธีแก้ไข:

1. **Deploy Edge Functions:**
   ```powershell
   cd apps/web
   npm run deploy:functions
   ```

2. **ตรวจสอบ Environment Variables:**
   ```bash
   # ตรวจสอบว่า NEXT_PUBLIC_SUPABASE_URL ถูกตั้งค่า
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

3. **ตรวจสอบ Edge Function Logs:**
   ```bash
   supabase functions logs update-profile --project-ref <project-ref>
   ```

4. **ทดสอบ Edge Function โดยตรง:**
   ```bash
   curl -X POST https://<project-ref>.supabase.co/functions/v1/update-profile \
     -H "Authorization: Bearer <access-token>" \
     -H "Content-Type: application/json" \
     -d '{"userId":"<user-id>","updates":{}}'
   ```

### Debug Steps:

1. **ตรวจสอบ Edge Functions accessibility:**
   ```powershell
   npm run check:functions
   ```
   หรือ
   ```powershell
   .\scripts\check-edge-functions.ps1
   ```

2. เปิด Browser DevTools > Network tab
3. ดู request ที่ fail
4. ตรวจสอบ:
   - Request URL ถูกต้องหรือไม่
   - Status code (0 = network error, 401 = unauthorized, 404 = not found)
   - Response headers
   - CORS errors ใน console
5. ตรวจสอบ Console logs:
   - ดู `[API Client]` logs สำหรับ URL และ error details
   - ดู `[Auth Context]` logs สำหรับ error context

### Common Issues:

#### Issue: Edge Function returns 404
**Solution:** Deploy Edge Function
```bash
npm run deploy:function update-profile
```

#### Issue: CORS error
**Solution:** ตรวจสอบว่า Edge Function มี CORS headers
```typescript
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

#### Issue: 401 Unauthorized
**Solution:** ตรวจสอบว่า access token ถูกส่งไป
- ตรวจสอบว่า user มี session
- ตรวจสอบว่า Authorization header ถูกส่ง

#### Issue: Network error (status 0)
**Solution:** 
- ตรวจสอบว่า Edge Function ถูก deploy แล้ว
- ตรวจสอบว่า URL ถูกต้อง
- ตรวจสอบ network connection

#### Issue: 503 Server Unavailable
**Solution:**
- Function อาจกำลัง restart หรือ deploy
- รอสักครู่แล้วลองใหม่
- Deploy function ใหม่: `npm run deploy:function <function-name>`
- ตรวจสอบ logs: `supabase functions logs <function-name> --project-ref <project-ref>`
- ตรวจสอบว่า function code ไม่มี syntax errors
- ตรวจสอบว่า function ไม่ timeout (default timeout: 60s)

