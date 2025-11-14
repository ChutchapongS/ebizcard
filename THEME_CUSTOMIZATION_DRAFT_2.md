# Theme Customization - Draft 2 (Resize + Delete Working)

## ✅ Features ที่ทำงานได้แล้ว

### 1. Drag & Drop
- ลาก element จาก panel ไปยัง canvas ได้
- ลาก element ใน canvas เพื่อย้ายตำแหน่งได้
- แยกการลากและการคลิกได้ (ไม่เปิด Property Panel เมื่อลาก)

### 2. Resize (8 ทิศทาง) ✅
- **Resize handles**: 8 จุดรอบๆ element (top-left, top, top-right, right, bottom-right, bottom, bottom-left, left)
- **Free resize**: resize ได้อิสระตามทิศทาง
- **Aspect ratio lock**: กด Shift ค้างไว้ขณะ resize
- **Position update**: element เคลื่อนที่เมื่อ resize จากซ้ายหรือบน
- **หลุดจาก resize mode**: เมื่อปล่อยเมาส์

### 3. Delete Button ✅
- **คลิกครั้งเดียว**: ปุ่มลบทำงานคลิกครั้งเดียว (ไม่ต้องดับเบิ้ลคลิก)
- **Event handling**: ใช้ `onMouseUp` แทน `onClick`
- **ไม่ชนกัน**: ไม่กระทบกับ drag/resize events

### 4. Element Selection
- คลิกเลือก element ได้
- แสดง resize handles เมื่อเลือก
- แสดง Property Panel เมื่อเลือก

### 5. Property Panel
- แก้ไข properties ของ element ได้
- Font size, color, alignment, etc.
- Real-time update

## 🔧 Technical Implementation

### Resize System
```tsx
// ใช้ useRef สำหรับ state เพื่อป้องกัน stale closure
const isResizingRef = useRef(false);
const resizeDirRef = useRef<ResizeDirection | null>(null);
const aspectRatioRef = useRef<number | null>(null);

// Local event handlers เพื่อป้องกัน memory leak
const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
const mouseUpHandler = () => handleMouseUp();
```

### Delete Button
```tsx
// ใช้ onMouseUp แทน onClick เพื่อป้องกัน double-click issue
onMouseDown={(e) => {
  e.stopPropagation();
  e.preventDefault();
}}
onMouseUp={(e) => {
  e.stopPropagation();
  e.preventDefault();
  onDelete(element.id);
}}
```

### Event Handling
- ใช้ `{ capture: true }` สำหรับ event listeners
- ปิด drag ของ dnd-kit ชั่วคราวระหว่าง resize
- ใช้ `elementRef.current` แทน `element` ใน callbacks

## 🐛 Issues ที่ต้องแก้ไข

### 1. Element Position After Resize
- หลังจาก resize แล้ว element เคลื่อนที่ไปจากตำแหน่งเดิม
- ควรอยู่ที่ตำแหน่งเดิมหลังจาก resize

### 2. Other Issues
- (ยังไม่พบ issues อื่นๆ)

## 📁 Files Modified

### `apps/web/src/components/theme-customization/DraggableElement.tsx`
- เพิ่ม 8-direction resize system
- ใช้ useRef สำหรับ state management
- แก้ไข event handling
- แก้ไข delete button (onMouseUp)

### `apps/web/src/app/theme-customization/page.tsx`
- แก้ไข `handleElementUpdate` ให้อัปเดต width/height
- แก้ไข drag logic

## 🎯 Next Steps

1. แก้ไขตำแหน่ง element หลังจาก resize
2. ทดสอบ features อื่นๆ
3. เพิ่ม features ใหม่ (ถ้ามี)

---
**Created**: 2024-12-19
**Status**: Draft 2 - Resize + Delete Working
