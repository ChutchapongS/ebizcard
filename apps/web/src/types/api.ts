// API Request/Response Types

// Cookie options type for Supabase SSR
export interface CookieOptions {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

// Profile update types
export interface ProfileUpdateRequest {
  full_name?: string;
  full_name_english?: string;
  personal_phone?: string;
  company?: string;
  department?: string;
  job_title?: string;
  work_phone?: string;
  work_email?: string;
  website?: string;
  facebook?: string;
  line_id?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  avatar_url?: string;
  profile_image?: string;
}

export interface ProfileUpdateResponse {
  success: boolean;
  error?: string | null;
}

// Address types
export interface AddressInput {
  type?: string;
  place?: string | null;
  address?: string;
  tambon?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
  postal_code?: string | null;
  country?: string;
}


// API Error types
export interface ApiError {
  error: string;
  message?: string;
  details?: string;
  stack?: string;
}

// Update user type request
export interface UpdateUserTypeRequest {
  userId: string;
  newRole: 'user' | 'admin' | 'owner';
}

// Web settings types
export interface WebSettingValue {
  [key: string]: string | number | boolean | null | undefined;
}

// User type update
export interface UserTypeUpdate {
  user_type: 'user' | 'admin' | 'owner';
  assigned_by: string;
  role_updated_at: string;
  user_plan?: string;
}

// Address from database
export interface AddressRow {
  id: string;
  user_id: string;
  type: string;
  place: string | null;
  address: string;
  tambon: string;
  district: string;
  province: string;
  postal_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

// Address Insert type (matches database Insert type)
export interface AddressInsert {
  user_id: string;
  type: string;
  place?: string | null;
  address: string;
  tambon: string;
  district: string;
  province: string;
  postal_code?: string | null;
  country?: string | null;
  created_at?: string;
  updated_at?: string;
}

