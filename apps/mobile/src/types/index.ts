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
  created_at: string;
  updated_at: string;
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