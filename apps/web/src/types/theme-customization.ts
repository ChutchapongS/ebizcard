export interface PaperSize {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

export interface PaperSettings {
  size: 'A4' | 'A5' | 'Business Card' | 'Business Card (L)' | 'Custom';
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  background: {
    type: 'color' | 'image' | 'gradient';
    color?: string;
    image?: string;
    imageFit?: 'cover' | 'contain' | 'fill' | 'none';
    imagePosition?: string;
    imageRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    gradient?: {
      type: 'base' | 'gradient';
      colors: string[];
      direction?: 'horizontal' | 'vertical' | 'diagonal';
    };
  };
}

export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textDecorationStyle?: 'solid' | 'double';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  backgroundColor?: string;
  backgroundOpacity?: number; // 0-100 for background transparency
  border?: {
    width: number;
    color: string;
    radius: number;
  };
  boxShadow?: string;
  filter?: string;
  opacity?: number;
  rotation?: number; // rotation in degrees
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'textarea' | 'picture' | 'social' | 'icon' | 'qrcode';
  field?: string; // field to bind to (name, description, etc.)
  x: number;
  y: number;
  width: number;
  height: number;
  style: ElementStyle;
  content?: string; // for static content
  imageUrl?: string; // for picture elements
  iconName?: string; // for icon elements
  qrUrl?: string; // for QR code elements
  qrStyle?: 'standard' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded' | 'custom-corners' | 'gradient-style'; // QR code style
  qrColor?: string; // QR code color
  qrLogo?: string; // QR code logo image URL
  useAddressPrefix?: boolean; // individual address prefix setting for this element
}

export interface Template {
  id: string;
  name: string;
  paper: PaperSettings;
  elements: CanvasElement[];
  createdAt: Date;
  updatedAt: Date;
  previewImage?: string;
}

export interface MockData {
  name: string;
  description: string;
  position: string;
  phone: string;
  email: string;
  companyLogo: string;
  company: string;
}

export const MOCK_DATA: MockData = {
  name: "John Doe",
  description: "Software Engineer",
  position: "Senior Developer",
  phone: "+1 (555) 123-4567",
  email: "john.doe@example.com",
  companyLogo: "/api/placeholder/80/80",
  company: "Tech Solutions Inc."
};

export const SAMPLE_USER_DATA = {
  full_name: "Chutchapong S.",
  personal_phone: "0642610555",
  personal_email: "metoo.excel@gmail.com",
  work_name: "Tech Solutions Inc.",
  work_department: "Engineering",
  work_position: "Senior Developer",
  work_phone: "+1 (555) 987-6543",
  work_email: "chutchapong@techsolutions.com",
  work_website: "https://techsolutions.com",
  address: "123 Main St, City, State 12345",
  facebook: "https://facebook.com/chutchapong",
  line_id: "@chutchapong",
  linkedin: "https://linkedin.com/in/chutchapong",
  twitter: "https://twitter.com/chutchapong",
  instagram: "https://instagram.com/chutchapong"
};

export const AVAILABLE_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'description', label: 'Description' },
  { value: 'position', label: 'Position' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'companyLogo', label: 'Company Logo' },
  { value: 'company', label: 'Company' }
] as const;

// Field options for different element types
export const ELEMENT_FIELD_OPTIONS = {
  text: [
    { value: '', label: 'Input Content' },
    { value: 'name', label: 'ชื่อ-นามสกุล' },
    { value: 'personalPhone', label: 'เบอร์โทรศัพท์ส่วนตัว' },
    { value: 'personalEmail', label: 'อีเมลส่วนตัว' },
    { value: 'workName', label: 'ชื่อที่ทำงาน' },
    { value: 'workDepartment', label: 'แผนก/ส่วนงาน' },
    { value: 'workPosition', label: 'ตำแหน่งงาน' },
    { value: 'workPhone', label: 'เบอร์โทรศัพท์ที่ทำงาน' },
    { value: 'workEmail', label: 'อีเมลที่ทำงาน' },
    { value: 'workWebsite', label: 'เว็บไซต์ที่ทำงาน' }
  ],
  textarea: [
    { value: '', label: 'Input Content' },
    { value: 'address', label: 'ที่อยู่' }
  ],
  social: [
    { value: 'facebook', label: 'Facebook' },
    { value: 'line', label: 'Line ID' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' }
  ]
};

export const PAPER_SIZES = {
  'Business Card (L)': { width: 180, height: 110 }, // mm
  'Business Card': { width: 90, height: 55 }, // mm
  A4: { width: 210, height: 297 }, // mm
  A5: { width: 148, height: 210 }, // mm
} as const;

// Convert mm to px (assuming 96 DPI)
export const MM_TO_PX = 3.7795275591;
