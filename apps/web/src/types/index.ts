export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface BusinessCard {
  id: string;
  user_id: string;
  name: string;
  job_title?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  social_links?: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  theme?: string;
  company_logo_url?: string;
  custom_theme?: CustomTheme;
  paper_card_settings?: PaperCardSettings;
  created_at: string;
  updated_at: string;
}

export interface CustomTheme {
  id?: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  layout: {
    type: 'horizontal' | 'vertical' | 'centered';
    logo_position: 'top' | 'left' | 'right' | 'bottom';
    text_alignment: 'left' | 'center' | 'right';
  };
  effects: {
    gradient?: {
      enabled: boolean;
      direction: string;
      colors: string[];
    };
    shadow?: {
      enabled: boolean;
      color: string;
      blur: number;
      offset: { x: number; y: number };
    };
    border?: {
      enabled: boolean;
      color: string;
      width: number;
      radius: number;
    };
  };
}

export interface PaperCardSettings {
  template_id: string;
  size: {
    width: number;
    height: number;
    unit: 'mm' | 'in' | 'px';
  };
  print_settings: {
    bleed: number;
    safe_area: number;
    resolution: number;
  };
  layout: {
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

export interface PaperCardTemplate {
  id: string;
  name: string;
  description: string;
  template_config: {
    width: number;
    height: number;
    unit: string;
    background: string;
    border: string;
    layout: string;
  };
  preview_url: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  visitor_id: string;
  card_id: string;
  visitor?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  card?: {
    id: string;
    name: string;
    job_title?: string;
    company?: string;
  };
  created_at: string;
}

export interface CardView {
  id: string;
  card_id: string;
  card_name?: string | null;
  viewer_ip: string;
  device_info: string;
  created_at: string;
}

export interface Template {
  id: string;
  name: string;
  theme: string;
  preview_url: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface QRCodeData {
  success: boolean;
  qrCode: string;
  publicUrl: string;
  card: {
    id: string;
    name: string;
    job_title?: string;
    company?: string;
  };
}

export interface VCardData {
  success: boolean;
  vcard: string;
  filename: string;
}

export interface CardStats {
  totalViews: number;
  uniqueViews: number;
  todayViews: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  theme_config: CustomTheme;
  is_premium: boolean;
}

export interface LogoUploadResult {
  success: boolean;
  url: string;
  filename: string;
  size: number;
}
