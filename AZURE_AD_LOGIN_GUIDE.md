# คู่มือการเพิ่ม Azure AD (Microsoft Authenticator) Login

## 📋 สารบัญ
1. [ภาพรวม](#ภาพรวม)
2. [ขั้นตอนที่ 1: ตั้งค่า Azure AD App Registration](#ขั้นตอนที่-1-ตั้งค่า-azure-ad-app-registration)
3. [ขั้นตอนที่ 2: ตั้งค่า Supabase](#ขั้นตอนที่-2-ตั้งค่า-supabase)
4. [ขั้นตอนที่ 3: เพิ่มโค้ดในโปรเจกต์](#ขั้นตอนที่-3-เพิ่มโค้ดในโปรเจกต์)
5. [การทดสอบ](#การทดสอบ)

---

## ภาพรวม

การเพิ่ม Azure AD login จะทำให้ผู้ใช้สามารถเข้าสู่ระบบด้วยบัญชี Microsoft (Outlook, Office 365, Hotmail) และใช้ Microsoft Authenticator สำหรับการยืนยันตัวตนแบบ 2FA

**สิ่งที่ต้องทำ:**
- สร้าง App Registration ใน Azure Portal
- ตั้งค่า OAuth provider ใน Supabase
- เพิ่มฟังก์ชัน `signInWithAzure` ในโค้ด
- เพิ่มปุ่ม Azure login ในหน้า login

---

## ขั้นตอนที่ 1: ตั้งค่า Azure AD App Registration

### 1.1 สร้าง App Registration

1. ไปที่ [Azure Portal](https://portal.azure.com)
2. ค้นหา "Azure Active Directory" หรือ "Microsoft Entra ID"
3. เลือก **App registrations** → **New registration**
4. กรอกข้อมูล:
   - **Name**: `eBizCard` (หรือชื่อที่ต้องการ)
   - **Supported account types**: เลือกตามความต้องการ
     - `Accounts in any organizational directory and personal Microsoft accounts` (แนะนำ)
   - `Accounts in this organizational directory only` (สำหรับองค์กรเท่านั้น)
   - `Personal Microsoft accounts only`
   - `Accounts in any organizational directory` (Multi-tenant)
   - `Accounts in any organizational directory` (Single-tenant)
   - `Personal Microsoft accounts only`
5. **Redirect URI**: 
   - Type: `Web`
   - URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - ตัวอย่าง: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
6. คลิก **Register**

### 1.2 รับ Client ID และ Client Secret

1. หลังจากสร้าง App Registration แล้ว ให้ไปที่ **Overview**
2. คัดลอก **Application (client) ID** → เก็บไว้ใช้ใน Supabase
3. ไปที่ **Certificates & secrets** → **New client secret**
4. กรอก:
   - **Description**: `Supabase OAuth`
   - **Expires**: เลือกระยะเวลา (แนะนำ 24 months)
5. คลิก **Add** → **คัดลอก Value ของ Secret** (จะแสดงแค่ครั้งเดียว!)

### 1.3 ตั้งค่า Redirect URI เพิ่มเติม

1. ไปที่ **Authentication**
2. เพิ่ม Redirect URI สำหรับ Mobile (ถ้าต้องการ):
   - Type: `Mobile and desktop applications`
   - URI: `exp://localhost:8081` (สำหรับ Expo development)
   - หรือ `your-app-scheme://` (สำหรับ production)

### 1.4 ตั้งค่า API Permissions (ถ้าต้องการ)

1. ไปที่ **API permissions**
2. เพิ่ม permissions ตามต้องการ:
   - `User.Read` (อ่านข้อมูลผู้ใช้)
   - `email` (อ่านอีเมล)
   - `profile` (อ่านโปรไฟล์)

---

## ขั้นตอนที่ 2: ตั้งค่า Supabase

### 2.1 เพิ่ม Azure AD Provider ใน Supabase Dashboard

1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. เลือกโปรเจกต์ของคุณ
3. ไปที่ **Authentication** → **Providers**
4. ค้นหา **Azure** หรือ **Microsoft** ในรายการ providers
5. เปิดใช้งาน (Enable) Azure provider
6. กรอกข้อมูล:
   - **Client ID (Application ID)**: ใส่ Application (client) ID จาก Azure
   - **Client Secret**: ใส่ Client Secret Value จาก Azure
   - **Redirect URL**: จะถูกสร้างอัตโนมัติ (ไม่ต้องแก้ไข)
     - ตัวอย่าง: `https://<your-project-ref>.supabase.co/auth/v1/callback`
7. **Tenant ID** (Optional): 
   - ถ้าใช้ Single-tenant: ใส่ Tenant ID จาก Azure Portal
   - ถ้าใช้ Multi-tenant: ใส่ `common` หรือ `organizations`
   - ถ้าใช้ Personal accounts: ใส่ `consumers`
   - ถ้าไม่ใส่: จะใช้ `common` (รองรับทั้ง organizational และ personal accounts)
8. คลิก **Save**

### 2.2 ตรวจสอบ Redirect URI ใน Azure

1. กลับไปที่ Azure Portal → App Registration → **Authentication**
2. ตรวจสอบว่า Redirect URI ตรงกับที่ Supabase แสดง:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. ถ้ายังไม่มี ให้เพิ่มเข้าไป

---

## ขั้นตอนที่ 3: เพิ่มโค้ดในโปรเจกต์

### 3.1 เพิ่มฟังก์ชันใน Mobile App

#### แก้ไข `apps/mobile/src/services/supabase.ts`

เพิ่มฟังก์ชัน `signInWithAzure` ใน auth service:

```typescript
signInWithAzure: async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'azure',
  });
},
```

#### แก้ไข `apps/mobile/src/contexts/AuthContext.tsx`

1. เพิ่ม `signInWithAzure` ใน interface:

```typescript
interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithLinkedIn: () => Promise<{ data: any; error: any }>;
  signInWithAzure: () => Promise<{ data: any; error: any }>; // เพิ่มบรรทัดนี้
  signOut: () => Promise<{ error: any }>;
}
```

2. เพิ่มฟังก์ชันใน AuthProvider:

```typescript
const signInWithAzure = async () => {
  return await auth.signInWithAzure();
};
```

3. เพิ่มใน value object:

```typescript
const value: AuthContextType = {
  user,
  isLoading,
  isAuthenticated: !!user,
  signUp,
  signIn,
  signInWithGoogle,
  signInWithLinkedIn,
  signInWithAzure, // เพิ่มบรรทัดนี้
  signOut,
};
```

#### แก้ไข `apps/mobile/src/screens/auth/LoginScreen.tsx`

1. เพิ่ม `signInWithAzure` จาก useAuth:

```typescript
const { signIn, signInWithGoogle, signInWithLinkedIn, signInWithAzure } = useAuth();
```

2. เพิ่ม handler function:

```typescript
const handleAzureLogin = async () => {
  setIsLoading(true);
  try {
    const { error } = await signInWithAzure();
    if (error) {
      Alert.alert('ข้อผิดพลาด', error.message);
    }
  } catch (error) {
    Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  } finally {
    setIsLoading(false);
  }
};
```

3. เพิ่มปุ่ม Azure login ในส่วน Social Login:

```typescript
{/* Social Login */}
<View className="mt-8">
  <Text className="text-center text-gray-500 mb-4">หรือเข้าสู่ระบบด้วย</Text>
  
  <TouchableOpacity
    className="border border-gray-300 rounded-lg py-4 items-center mb-3"
    onPress={handleGoogleLogin}
    disabled={isLoading}
  >
    <View className="flex-row items-center">
      <Ionicons name="logo-google" size={20} color="#DB4437" />
      <Text className="text-gray-700 ml-2 font-medium">Google</Text>
    </View>
  </TouchableOpacity>

  <TouchableOpacity
    className="border border-gray-300 rounded-lg py-4 items-center mb-3"
    onPress={handleLinkedInLogin}
    disabled={isLoading}
  >
    <View className="flex-row items-center">
      <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
      <Text className="text-gray-700 ml-2 font-medium">LinkedIn</Text>
    </View>
  </TouchableOpacity>

  {/* เพิ่มปุ่ม Azure */}
  <TouchableOpacity
    className="border border-gray-300 rounded-lg py-4 items-center"
    onPress={handleAzureLogin}
    disabled={isLoading}
  >
    <View className="flex-row items-center">
      <Ionicons name="logo-microsoft" size={20} color="#0078D4" />
      <Text className="text-gray-700 ml-2 font-medium">Microsoft</Text>
    </View>
  </TouchableOpacity>
</View>
```

### 3.2 เพิ่มฟังก์ชันใน Web App

#### แก้ไข `apps/web/src/lib/auth-context.tsx`

1. เพิ่ม `signInWithAzure` ใน interface:

```typescript
interface AuthContextType {
  // ... existing properties
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithLinkedIn: () => Promise<{ data: any; error: any }>;
  signInWithAzure: () => Promise<{ data: any; error: any }>; // เพิ่มบรรทัดนี้
  // ... rest of properties
}
```

2. เพิ่มฟังก์ชันใน AuthProvider:

```typescript
const signInWithAzure = async () => {
  try {
    const result = await supabase?.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    const data = result?.data || null;
    const error = result?.error || null;
    
    if (error && error.message.includes('provider is not enabled')) {
      toast.error('Azure AD OAuth ยังไม่ได้เปิดใช้งาน กรุณาใช้การเข้าสู่ระบบด้วยอีเมลแทน');
      return { data: null, error: { message: 'Azure AD OAuth not enabled' } };
    }
    
    return { data, error };
  } catch (error) {
    console.error('Azure AD OAuth error:', error);
    toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Microsoft');
    return { data: null, error };
  }
};
```

3. เพิ่มใน value object:

```typescript
const value: AuthContextType = {
  // ... existing properties
  signInWithGoogle,
  signInWithLinkedIn,
  signInWithAzure, // เพิ่มบรรทัดนี้
  // ... rest of properties
};
```

#### แก้ไข `apps/web/src/app/auth/login/page.tsx`

1. เพิ่ม handler function:

```typescript
const handleAzureLogin = async () => {
  try {
    const { data, error } = await supabase!.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    if (error && error.message.includes('provider is not enabled')) {
      setShowOAuthWarning(true);
      setError('Azure AD OAuth ยังไม่ได้เปิดใช้งาน กรุณาใช้การเข้าสู่ระบบด้วยอีเมลแทน');
    }
  } catch (error) {
    console.error('Azure AD OAuth error:', error);
    setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Microsoft');
  }
};
```

2. เพิ่มปุ่ม Azure login ในส่วน Social Login:

```typescript
<div className="mt-6 grid grid-cols-3 gap-3">
  <button
    onClick={handleGoogleLogin}
    disabled={isLoading}
    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
  >
    {/* Google SVG */}
    <span className="ml-2">Google</span>
  </button>

  <button
    onClick={handleLinkedInLogin}
    disabled={isLoading}
    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
  >
    {/* LinkedIn SVG */}
    <span className="ml-2">LinkedIn</span>
  </button>

  {/* เพิ่มปุ่ม Azure */}
  <button
    onClick={handleAzureLogin}
    disabled={isLoading}
    className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
  >
    <svg className="w-5 h-5" viewBox="0 0 23 23" fill="currentColor">
      <path d="M0 0h23v23H0z" fill="#f3f3f3"/>
      <path d="M0 0h11v11H0z" fill="#f35325"/>
      <path d="M12 0h11v11H12z" fill="#81bc06"/>
      <path d="M0 12h11v11H0z" fill="#05a6f0"/>
      <path d="M12 12h11v11H12z" fill="#ffba08"/>
    </svg>
    <span className="ml-2">Microsoft</span>
  </button>
</div>
```

**หมายเหตุ:** เปลี่ยน `grid-cols-2` เป็น `grid-cols-3` เพื่อให้มี 3 ปุ่ม

---

## การทดสอบ

### ทดสอบบน Web

1. เปิดหน้า login: `http://localhost:3000/auth/login`
2. คลิกปุ่ม "Microsoft"
3. ควรจะ redirect ไปที่หน้า Microsoft login
4. หลังจาก login สำเร็จ ควรจะ redirect กลับมาที่ `/dashboard`

### ทดสอบบน Mobile

1. เปิดหน้า login ในแอป
2. คลิกปุ่ม "Microsoft"
3. ควรจะเปิด browser หรือ in-app browser สำหรับ login
4. หลังจาก login สำเร็จ ควรจะกลับมาที่แอปและเข้าสู่ระบบ

### ปัญหาที่อาจพบ

1. **"Provider is not enabled"**
   - ตรวจสอบว่าเปิดใช้งาน Azure provider ใน Supabase แล้ว
   - ตรวจสอบว่า Client ID และ Client Secret ถูกต้อง

2. **"Redirect URI mismatch"**
   - ตรวจสอบว่า Redirect URI ใน Azure ตรงกับที่ Supabase กำหนด
   - ตัวอย่าง: `https://<your-project-ref>.supabase.co/auth/v1/callback`

3. **"Invalid client"**
   - ตรวจสอบว่า Client ID และ Client Secret ถูกต้อง
   - ตรวจสอบว่า Client Secret ยังไม่หมดอายุ

4. **ไม่สามารถ login ได้**
   - ตรวจสอบว่า Tenant ID ถูกต้อง (ถ้าใช้ Single-tenant)
   - ตรวจสอบว่า API Permissions ถูกตั้งค่าแล้ว

---

## สรุป

หลังจากทำตามขั้นตอนทั้งหมด คุณจะสามารถ:

✅ Login ด้วยบัญชี Microsoft (Outlook, Office 365, Hotmail)  
✅ ใช้ Microsoft Authenticator สำหรับ 2FA  
✅ รองรับทั้ง Organizational และ Personal Microsoft accounts (ถ้าตั้งค่าเป็น `common`)

**ไฟล์ที่ต้องแก้ไข:**
- `apps/mobile/src/services/supabase.ts`
- `apps/mobile/src/contexts/AuthContext.tsx`
- `apps/mobile/src/screens/auth/LoginScreen.tsx`
- `apps/web/src/lib/auth-context.tsx`
- `apps/web/src/app/auth/login/page.tsx`

---

## ข้อมูลเพิ่มเติม

- [Supabase Azure AD Documentation](https://supabase.com/docs/guides/auth/social-login/auth-azure)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)

