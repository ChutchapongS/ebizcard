# Theme Customization Page

หน้าเว็บสำหรับสร้างและแก้ไข template นามบัตรด้วย drag & drop interface

## คุณสมบัติ

### 1. โครงสร้างหน้าจอ
- **2 Tabs หลัก:**
  - สร้าง Template นามบัตร
  - Template ที่มี

### 2. Tab "สร้าง Template นามบัตร"
- **Canvas (ซ้าย):** พื้นที่ preview template พร้อม drag & drop
- **Right Panel (ขวา):** ตั้งค่าและ UI elements

### 3. การตั้งค่าหน้ากระดาษ
- เลือกขนาด: A4, A5, Custom
- ตั้งค่าความกว้าง x ยาว (px)
- เลือกแนวตั้ง/แนวนอน
- ตั้งค่า background: สี หรือ รูปภาพ

### 4. UI Elements
- **Text:** ข้อความธรรมดา
- **Text Area:** ข้อความหลายบรรทัด
- **Logo:** รูปภาพ/โลโก้

### 5. Drag & Drop
- ลาก elements จาก panel ขวามาใส่ใน canvas
- Move/resize/delete elements ได้
- ใช้ `@dnd-kit` library

### 6. Property Panel
- เปิดเมื่อคลิก element
- ตั้งค่า field binding
- ตั้งค่า style (font, color, alignment, padding, border)
- อัพโหลดรูปสำหรับ logo

### 7. Data Binding
- Bind กับ fields: name, description, position, phone, email, companyLogo, company
- แสดง mock data ใน preview

## การใช้งาน

1. ไปที่ `/theme-customization`
2. เลือก tab "สร้าง Template นามบัตร"
3. ตั้งค่าหน้ากระดาษใน Right Panel
4. ลาก elements จาก panel มาวางใน canvas
5. คลิก element เพื่อเปิด Property Panel
6. ตั้งค่า properties และ field binding
7. กด Save Template

## ไฟล์ที่เกี่ยวข้อง

```
src/
├── app/theme-customization/page.tsx          # Main page
├── components/theme-customization/
│   ├── Canvas.tsx                            # Canvas area
│   ├── DraggableElement.tsx                  # Individual elements
│   ├── RightPanel.tsx                        # Settings panel
│   ├── PropertyPanel.tsx                     # Element properties
│   └── DraggableItem.tsx                     # Draggable items
├── types/theme-customization.ts              # TypeScript types
└── app/globals.css                           # Styles for react-colorful
```

## Dependencies

- `@dnd-kit/core` - Drag and drop functionality
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - Utility functions
- `react-colorful` - Color picker

## Template JSON Structure

```json
{
  "paper": {
    "size": "A4",
    "width": 794,
    "height": 1123,
    "orientation": "portrait",
    "background": {
      "type": "color",
      "color": "#ffffff"
    }
  },
  "elements": [
    {
      "id": "element-1",
      "type": "text",
      "field": "name",
      "x": 50,
      "y": 40,
      "width": 200,
      "height": 40,
      "style": {
        "fontSize": 16,
        "color": "#000000",
        "textAlign": "left"
      }
    }
  ]
}
```

## Mock Data

```typescript
const MOCK_DATA = {
  name: "John Doe",
  description: "Software Engineer",
  position: "Senior Developer",
  phone: "+1 (555) 123-4567",
  email: "john.doe@example.com",
  companyLogo: "/api/placeholder/80/80",
  company: "Tech Solutions Inc."
};
```
