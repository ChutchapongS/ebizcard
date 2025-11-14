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

// Auth service
export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  signInWithGoogle: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  },

  signInWithLinkedIn: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  },
};

// Business Cards service
export const businessCards = {
  getAll: async (userId: string) => {
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('business_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (cardData: any) => {
    const { data, error } = await supabase
      .from('business_cards')
      .insert(cardData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('business_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('business_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

// Profiles service
export const profiles = {
  get: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  update: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Contacts service
export const contacts = {
  getAll: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        visitor:profiles!contacts_visitor_id_fkey(id, full_name, email, avatar_url),
        card:business_cards!contacts_card_id_fkey(id, name, job_title, company)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  create: async (contactData: any) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

// Card Views service
export const cardViews = {
  track: async (cardId: string, deviceInfo: string) => {
    const { data, error } = await supabase
      .from('card_views')
      .insert({
        card_id: cardId,
        viewer_ip: 'unknown',
        device_info: deviceInfo,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getByCardId: async (cardId: string) => {
    const { data, error } = await supabase
      .from('card_views')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getStats: async (cardId: string) => {
    const { data, error } = await supabase
      .from('card_views')
      .select('*')
      .eq('card_id', cardId);

    if (error) throw error;
    
    const totalViews = data.length;
    const uniqueViews = new Set(data.map(view => view.viewer_ip)).size;
    const todayViews = data.filter(view => {
      const today = new Date().toDateString();
      const viewDate = new Date(view.created_at).toDateString();
      return today === viewDate;
    }).length;

    return {
      totalViews,
      uniqueViews,
      todayViews,
    };
  },
};

// Templates service
export const templates = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};

// QR Code service
export const qrCode = {
  generate: async (cardId: string) => {
    const { data, error } = await supabase.functions.invoke('generate-qr', {
      body: { cardId },
    });

    if (error) throw error;
    return data;
  },
};

// vCard service
export const vCard = {
  generate: async (cardId: string) => {
    const { data, error } = await supabase.functions.invoke('generate-vcard', {
      body: { cardId },
    });

    if (error) throw error;
    return data;
  },
};