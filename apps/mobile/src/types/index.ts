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
  social_links?: SocialLinks;
  theme: string;
  created_at: string;
  updated_at?: string;
}

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  github?: string;
}

export interface Template {
  id: string;
  name: string;
  theme: string;
  preview_url: string;
  created_at: string;
}

export interface Contact {
  id: string;
  owner_id: string;
  visitor_id: string;
  card_id: string;
  created_at: string;
}

export interface CardView {
  id: string;
  card_id: string;
  viewer_ip: string;
  device_info: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface CreateCardData {
  name: string;
  job_title?: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  social_links?: SocialLinks;
  theme: string;
}

export interface UpdateCardData extends Partial<CreateCardData> {
  id: string;
}
