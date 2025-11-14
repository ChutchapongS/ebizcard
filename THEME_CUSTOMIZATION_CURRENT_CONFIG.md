# Theme Customization - Current Configuration Backup

## Overview
This document captures the current working configuration of the Theme Customization page as of the latest successful implementation.

## Current Features Status

### ✅ Working Features

#### 1. Layout Structure
- **Header**: "Theme Customization" with Thai subtitle
- **Main Tabs**: "สร้าง Template นามบัตร" (Create) and "Template ที่มี" (Existing)
- **Container**: White card with `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **Two-column layout**: Canvas (2/3) + RightPanel (1/3)

#### 2. RightPanel (Property Panel)
- **Four equal-width tabs**: "Page Layout", "Background", "Elements", "Property"
- **Tab styling**: `flex-1 px-3 py-3 text-sm font-medium whitespace-nowrap`
- **No scroll bars**: Equal distribution prevents overflow
- **White card design**: `bg-white rounded-lg shadow-sm border border-gray-200`

#### 3. Page Layout Tab
- **Paper Size**: Dropdown with A4 (210×297mm), A5 (148×210mm), Custom
- **Custom Size Inputs**: Width/Height in mm with proper behavior
  - Can delete to empty field
  - Shows placeholder when empty
  - Converts mm to px for Canvas display
- **Orientation**: Portrait/Landscape with proper swapping

#### 4. Canvas Area
- **Responsive sizing**: Max 600px width, 400px height
- **mm to px conversion**: 1mm = 3.7795275591px (96 DPI)
- **Drag & Drop**: Works for both new elements and moving existing ones
- **Visual feedback**: Border changes color when dragging

#### 5. Elements Tab
- **Draggable items**: Text, Text Area, Logo
- **Field binding**: Shows which field each element binds to
- **Icons**: Visual representation for each element type

#### 6. Property Tab
- **Shows when element selected**: Displays element properties
- **Placeholder when no selection**: "Select an element to edit properties"
- **Font Size input**: 
  - Can delete to empty field
  - Real-time updates
  - Preserves element position
  - Min 0, max 72

#### 7. Drag & Drop System
- **New elements**: Creates new element from panel
- **Existing elements**: Moves existing element (no copying)
- **Position calculation**: Uses delta for accurate positioning
- **Canvas ID**: `id="canvas"` for proper targeting

### 🔧 Technical Implementation

#### File Structure
```
apps/web/src/
├── app/theme-customization/page.tsx (Main page)
├── components/theme-customization/
│   ├── RightPanel.tsx (Property panel with tabs)
│   ├── Canvas.tsx (Canvas area with drag & drop)
│   ├── PropertyPanel.tsx (Element properties editing)
│   ├── DraggableElement.tsx (Individual draggable elements)
│   └── DraggableItem.tsx (Panel draggable items)
└── types/theme-customization.ts (TypeScript interfaces)
```

#### Key Classes and Styling
- **Layout**: `flex gap-6`, `w-2/3`, `w-1/3`
- **Cards**: `bg-white rounded-lg shadow-sm border border-gray-200`
- **Tabs**: `flex-1 px-3 py-3 text-sm font-medium whitespace-nowrap`
- **Inputs**: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`

#### State Management
- **Paper Settings**: mm-based with px conversion for display
- **Elements**: Array with position, size, and style properties
- **Selected Element**: Current element being edited
- **Drag State**: Tracking drag operations

#### Data Flow
1. **Drag Start**: Sets `isDragging` state
2. **Drag End**: Handles both new and existing elements
3. **Element Update**: Preserves position while updating style
4. **Property Changes**: Real-time updates with position preservation

### 🎯 Current Working Behaviors

#### Font Size Input
- ✅ Can delete to empty field
- ✅ Real-time updates
- ✅ Preserves element position
- ✅ Shows placeholder "16"
- ✅ Min 0, max 72

#### Drag & Drop
- ✅ New elements from panel create new instances
- ✅ Existing elements move without copying
- ✅ Accurate position calculation
- ✅ Visual feedback during drag

#### Paper Settings
- ✅ mm-based measurements
- ✅ Proper A4/A5 dimensions
- ✅ Orientation swapping works
- ✅ Custom size inputs work correctly

#### Layout
- ✅ Responsive design
- ✅ Equal-width tabs
- ✅ No overflow issues
- ✅ Clean, modern aesthetic

### 📝 Notes for Future Development
- All major functionality is working
- Font Size input behavior is optimized
- Drag & drop system is robust
- Layout is responsive and clean
- Ready for additional features

### 🚀 Next Steps Available
- Add more element types
- Implement template saving/loading
- Add more styling options
- Implement undo/redo
- Add element grouping
- Implement alignment tools

---
**Last Updated**: Current session
**Status**: All core features working correctly
**Ready for**: Additional feature development
