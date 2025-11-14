export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      business_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          job_title: string | null
          company: string | null
          phone: string | null
          email: string | null
          address: string | null
          social_links: Json | null
          theme: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          job_title?: string | null
          company?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          social_links?: Json | null
          theme?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          job_title?: string | null
          company?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          social_links?: Json | null
          theme?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      card_views: {
        Row: {
          id: string
          card_id: string
          viewer_ip: string
          device_info: string
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          viewer_ip: string
          device_info: string
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          viewer_ip?: string
          device_info?: string
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          owner_id: string
          visitor_id: string
          card_id: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          visitor_id: string
          card_id: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          visitor_id?: string
          card_id?: string
          created_at?: string
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          type: string
          place: string | null
          address: string
          tambon: string
          district: string
          province: string
          postal_code: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          place?: string | null
          address: string
          tambon: string
          district: string
          province: string
          postal_code?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          place?: string | null
          address?: string
          tambon?: string
          district?: string
          province?: string
          postal_code?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          theme: string
          preview_url: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          theme: string
          preview_url: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          theme?: string
          preview_url?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}