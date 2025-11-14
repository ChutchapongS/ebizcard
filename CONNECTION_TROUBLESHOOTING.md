# แก้ไขปัญหา Supabase Connection Error

## ปัญหาที่พบ
```
GET https://eccyqifrzipzrflkcdkd.supabase.co/auth/v1/user net::ERR_CONNECTION_CLOSED
TypeError: Failed to fetch
AuthRetryableFetchError: Failed to fetch
```

## สาเหตุที่เป็นไปได้

### 1. **Supabase Project Issues**
- โปรเจคถูกปิดหรือหยุดทำงาน
- เกิน quota limit (free tier)
- Billing issues

### 2. **Network/Internet Issues**
- การเชื่อมต่ออินเทอร์เน็ตไม่เสถียร
- DNS resolution problems
- Firewall blocking connections
- Proxy/VPN interference

### 3. **Browser/Client Issues**
- Browser cache corruption
- CORS issues
- SSL certificate problems

## วิธีแก้ไข

### **ขั้นตอนที่ 1: ตรวจสอบ Supabase Project**

1. **ไปที่ Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **ตรวจสอบสถานะโปรเจค**
   - โปรเจคยัง Active อยู่หรือไม่
   - มีข้อความเตือนหรือไม่
   - Billing status เป็นอย่างไร

3. **ตรวจสอบ Project URL**
   - URL: `https://eccyqifrzipzrflkcdkd.supabase.co`
   - ต้องตรงกับที่ใช้ใน `.env.local`

### **ขั้นตอนที่ 2: ตรวจสอบ Network**

1. **ทดสอบการเชื่อมต่อ**
   ```bash
   # ทดสอบ ping
   ping eccyqifrzipzrflkcdkd.supabase.co
   
   # ทดสอบ DNS
   nslookup eccyqifrzipzrflkcdkd.supabase.co
   ```

2. **ทดสอบใน Browser**
   - เปิด `https://eccyqifrzipzrflkcdkd.supabase.co` ใน browser
   - ดูว่าสามารถเข้าถึงได้หรือไม่

3. **ทดสอบ API Endpoint**
   ```
   https://eccyqifrzipzrflkcdkd.supabase.co/rest/v1/
   ```

### **ขั้นตอนที่ 3: แก้ไข Network Issues**

1. **เปลี่ยน DNS**
   ```bash
   # Windows
   netsh interface ip set dns "Wi-Fi" static 8.8.8.8
   netsh interface ip add dns "Wi-Fi" 8.8.4.4 index=2
   
   # macOS
   sudo networksetup -setdnsservers Wi-Fi 8.8.8.8 8.8.4.4
   ```

2. **รีเซ็ต Network Settings**
   ```bash
   # Windows
   netsh int ip reset
   netsh winsock reset
   ipconfig /flushdns
   
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

3. **ปิด Firewall/Antivirus ชั่วคราว**
   - ปิด Windows Firewall
   - ปิด Antivirus real-time protection
   - ทดสอบการเชื่อมต่อ

### **ขั้นตอนที่ 4: แก้ไข Browser Issues**

1. **Clear Browser Cache**
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)

2. **Disable Extensions**
   - เปิด Incognito/Private mode
   - ปิด browser extensions

3. **Try Different Browser**
   - Chrome, Firefox, Safari, Edge

### **ขั้นตอนที่ 5: แก้ไข Application**

1. **ตรวจสอบ Environment Variables**
   ```bash
   # ตรวจสอบ .env.local
   cat apps/web/.env.local
   ```

2. **รีสตาร์ท Development Server**
   ```bash
   # หยุด server
   Ctrl+C
   
   # ลบ node_modules และ reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # รันใหม่
   npm run dev
   ```

3. **ตรวจสอบ Supabase Status**
   ```
   https://status.supabase.com/
   ```

### **ขั้นตอนที่ 6: Alternative Solutions**

1. **ใช้ Local Supabase**
   ```bash
   npm install -g supabase
   supabase start
   
   # ใช้ local credentials
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-key
   ```

2. **สร้าง Supabase Project ใหม่**
   - สร้างโปรเจคใหม่
   - Copy credentials ใหม่
   - รัน migrations ใหม่

3. **ใช้ Mock Data**
   - ปิด Supabase connection
   - ใช้ local mock data
   - สำหรับ development เท่านั้น

## การป้องกัน

### 1. **เพิ่ม Retry Logic**
```typescript
const withRetry = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 2. **เพิ่ม Connection Health Check**
```typescript
const checkConnection = async () => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    return response.ok;
  } catch {
    return false;
  }
};
```

### 3. **เพิ่ม Offline Mode**
- เก็บข้อมูลใน localStorage
- แสดงข้อมูล cached
- Sync เมื่อกลับมาออนไลน์

## การติดต่อ Support

หากยังแก้ไขไม่ได้:
1. **Supabase Support**: https://supabase.com/support
2. **GitHub Issues**: สร้าง issue ใน repository
3. **Community Discord**: https://discord.supabase.com/

## ข้อมูลเพิ่มเติม

- **Supabase Documentation**: https://supabase.com/docs
- **Troubleshooting Guide**: https://supabase.com/docs/guides/getting-started/troubleshooting
- **Status Page**: https://status.supabase.com/
