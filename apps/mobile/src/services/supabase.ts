import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    return { data, error };
  },

  signInWithLinkedIn: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Business Cards API
export const businessCards = {
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  create: async (cardData: any) => {
    const { data, error } = await supabase
      .from('business_cards')
      .insert([cardData])
      .select()
      .single();
    return { data, error };
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('business_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('business_cards')
      .delete()
      .eq('id', id);
    return { error };
  },
};

// Templates API
export const templates = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('name');
    return { data, error };
  },
};

// Contacts API
export const contacts = {
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        business_cards!inner(
          id,
          name,
          job_title,
          company,
          phone,
          email
        )
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  add: async (contactData: any) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select()
      .single();
    return { data, error };
  },
};

// Card Views API
export const cardViews = {
  track: async (cardId: string, viewerIp: string, deviceInfo: string) => {
    const { data, error } = await supabase
      .from('card_views')
      .insert([{
        card_id: cardId,
        viewer_ip: viewerIp,
        device_info: deviceInfo,
      }])
      .select()
      .single();
    return { data, error };
  },
};
