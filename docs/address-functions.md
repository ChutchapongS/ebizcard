# Address Functions Documentation

## Overview
ระบบจัดการข้อมูลที่อยู่ของประเทศไทยที่ใช้ข้อมูลจากไฟล์ `address.js` ซึ่งประกอบด้วยจังหวัด อำเภอ/เขต ตำบล/แขวง และรหัสไปรษณีย์

## Files Structure
```
├── address.js                           # ข้อมูลที่อยู่ของประเทศไทย
├── apps/web/src/utils/address.ts        # Utility functions สำหรับ web
├── apps/mobile/src/utils/address.ts     # Utility functions สำหรับ mobile
├── apps/web/src/components/address/     # React components สำหรับ web
│   └── AddressSelector.tsx
└── apps/mobile/src/components/          # React Native components
    └── AddressSelector.tsx
```

## Available Functions

### Basic Functions
- `getProvinces()` - ดึงรายชื่อจังหวัดทั้งหมด
- `getDistricts(province)` - ดึงรายชื่ออำเภอ/เขตตามจังหวัด
- `getTambons(province, district)` - ดึงรายชื่อตำบล/แขวงตามอำเภอ/เขต
- `getPostalCode(province, district)` - ดึงรหัสไปรษณีย์ตามอำเภอ/เขต

### Advanced Functions
- `getAddressData(province, district)` - ดึงข้อมูลที่อยู่ทั้งหมด
- `searchByPostalCode(postalCode)` - ค้นหาจากรหัสไปรษณีย์
- `searchByTambon(tambonName)` - ค้นหาจากชื่อตำบล/แขวง
- `validateAddress(province, district, tambon)` - ตรวจสอบความถูกต้องของที่อยู่
- `formatFullAddress(addressData)` - สร้างข้อความที่อยู่แบบเต็ม

### Data Functions
- `getAllProvincesWithDistricts()` - ดึงข้อมูลจังหวัดพร้อมอำเภอ/เขต
- `getAllDistrictsWithTambons(province)` - ดึงข้อมูลอำเภอ/เขตพร้อมตำบล/แขวง

## Usage Examples

### Web Application
```tsx
import { AddressSelector } from '@/components/address/AddressSelector';
import { getProvinces, getDistricts } from '@/utils/address';

// Using AddressSelector component
<AddressSelector
  value={{
    province: 'กรุงเทพมหานคร',
    district: 'สัมพันธวงศ์',
    tambon: 'จักรวรรดิ',
    postalCode: '10100'
  }}
  onChange={(addressData) => {
    console.log('Address changed:', addressData);
  }}
/>

// Using utility functions directly
const provinces = getProvinces();
const districts = getDistricts('กรุงเทพมหานคร');
```

### Mobile Application
```tsx
import { AddressSelector } from '../components/AddressSelector';
import { getProvinces, getDistricts } from '../utils/address';

// Using AddressSelector component
<AddressSelector
  value={{
    province: 'กรุงเทพมหานคร',
    district: 'สัมพันธวงศ์',
    tambon: 'จักรวรรดิ',
    postalCode: '10100'
  }}
  onChange={(addressData) => {
    console.log('Address changed:', addressData);
  }}
/>
```

## Data Structure

### Address Data Format
```typescript
interface AddressData {
  province: string;    // จังหวัด
  district: string;    // อำเภอ/เขต
  tambon: string;      // ตำบล/แขวง
  postalCode: number;  // รหัสไปรษณีย์
}
```

### Address Selector Props
```typescript
interface AddressSelectorProps {
  value?: {
    province: string;
    district: string;
    tambon: string;
    postalCode: string;
  };
  onChange: (address: {
    province: string;
    district: string;
    tambon: string;
    postalCode: string;
  }) => void;
  className?: string;    // Web only
  disabled?: boolean;
}
```

## Integration

### Settings Page
ในหน้า Settings (Tab ที่อยู่) จะใช้ AddressSelector แทนการกรอกข้อมูลที่อยู่แบบเดิม โดยจะมีการแสดงข้อมูล:
- ประเภทที่อยู่ (บ้าน, ที่ทำงาน, อื่นๆ)
- ที่อยู่ (บ้านเลขที่, ซอย, ถนน)
- จังหวัด, อำเภอ/เขต, ตำบล/แขวง (ใช้ dropdown)
- รหัสไปรษณีย์ (แสดงอัตโนมัติ)
- ประเทศ

### Card Editor Page
ในหน้า Card Editor จะใช้ AddressSelector สำหรับการกรอกข้อมูลที่อยู่ในนามบัตร โดยจะรวมข้อมูลที่อยู่ทั้งหมดเป็นข้อความเดียว

## Features

### Auto-complete
- เลือกจังหวัด → แสดงอำเภอ/เขตในจังหวัดนั้น
- เลือกอำเภอ/เขต → แสดงตำบล/แขวงในอำเภอ/เขตนั้น
- เลือกอำเภอ/เขต → แสดงรหัสไปรษณีย์อัตโนมัติ

### Validation
- ตรวจสอบความถูกต้องของข้อมูลที่อยู่
- ป้องกันการเลือกข้อมูลที่ไม่ตรงกัน

### Search
- ค้นหาจากรหัสไปรษณีย์
- ค้นหาจากชื่อตำบล/แขวง

## Notes
- ข้อมูลที่อยู่จะถูกโหลดจากไฟล์ `address.js` ที่มีข้อมูลครบถ้วนของประเทศไทย
- AddressSelector จะ reset ข้อมูลที่เกี่ยวข้องเมื่อมีการเปลี่ยนจังหวัดหรืออำเภอ/เขต
- รหัสไปรษณีย์จะถูกแสดงอัตโนมัติเมื่อเลือกอำเภอ/เขต
