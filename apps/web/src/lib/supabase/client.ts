import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_key';

// For development without proper credentials, use a mock setup
const isDevelopment = process.env.NODE_ENV === 'development';
const hasValidEnvCredentials = supabaseUrl !== 'https://demo.supabase.co' && 
  supabaseAnonKey !== 'demo_key' && 
  supabaseAnonKey.length > 50;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl !== 'https://demo.supabase.co' && 
  supabaseAnonKey !== 'demo_key' && 
  supabaseAnonKey.length > 50;

// Always use real Supabase client - no mock
if (!hasValidCredentials) {
  console.error('❌ Invalid Supabase credentials!');
  console.error('📖 Please set up real Supabase project:');
  console.error('   1. Go to https://supabase.com/dashboard');
  console.error('   2. Create new project');
  console.error('   3. Copy URL and Anon Key to .env.local');
  console.error('   4. See SUPABASE_CONNECTION_FIX.md for details');
  
  // Don't throw error in development, just warn
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Running in development mode without valid Supabase credentials');
  } else {
    throw new Error('Invalid Supabase credentials. Please set up real Supabase project.');
  }
}

// Global variable to prevent multiple instances (Singleton Pattern)
declare global {
  var __supabaseClient: ReturnType<typeof createClient> | null;
}

// Create Supabase client with fallback values to prevent errors
const createSupabaseClient = () => {
  // Use fallback values if environment variables are not set
  const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
  const safeKey = supabaseAnonKey || 'placeholder-key';

  return createClient<Database>(safeUrl, safeKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
    db: {
      schema: 'public',
    },
  });
};

// Singleton pattern to prevent multiple client instances
export const supabase = (() => {
  if (typeof window !== 'undefined') {
    // Browser environment
    if (!window.__supabaseClient) {
      window.__supabaseClient = createSupabaseClient() as any;
    }
    return window.__supabaseClient;
  } else {
    // Server environment
    if (!global.__supabaseClient) {
      global.__supabaseClient = createSupabaseClient() as any;
    }
    return global.__supabaseClient;
  }
})();

// Export createClient function for use in components
export { createClient };

// Connection health check utility
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Test with direct fetch instead of Supabase client
    const response = await fetch(`${supabaseUrl}/rest/v1/business_cards?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Supabase connection test failed:', response.status, response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Test Supabase connection and log detailed info
export const testSupabaseConnection = async () => {
  try {
    // Test 1: Simple fetch to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return false;
    }
    
    // Test 2: Auth status
    const { data: { session }, error: sessionError } = await supabase!.auth.getSession();
    if (sessionError) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};

// Simple connection test without Supabase client
export const testDirectConnection = async () => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/business_cards?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Direct connection test error:', error);
    return false;
  }
};

// Retry wrapper for Supabase operations with connection check
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection before attempting operation
      const isConnected = await checkSupabaseConnection();
      if (!isConnected && attempt > 1) {
        console.warn(`Connection check failed on attempt ${attempt}, skipping...`);
        throw new Error('No connection to Supabase');
      }
      
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Check if it's a connection error
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('ERR_CONNECTION_CLOSED') ||
        error.message.includes('ERR_NETWORK_CHANGED') ||
        error.message.includes('ERR_HTTP2_PROTOCOL_ERROR')
      )) {
        console.warn('Connection error detected, will retry...');
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

// Global connection monitor state to prevent multiple instances
let connectionMonitorInstance: (() => void) | null = null;
let isConnectionMonitorRunning = false;
let connectionMonitorStarted = false;

// Function to stop connection monitor
export const stopConnectionMonitor = () => {
  if (connectionMonitorInstance) {
    connectionMonitorInstance();
    connectionMonitorInstance = null;
  }
  isConnectionMonitorRunning = false;
  connectionMonitorStarted = false;
  
  // Dispatch final connection status to clear any error states
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('supabase-connection-status', { 
      detail: { connected: true, loggedOut: true, timestamp: Date.now() } 
    }));
  }
};

// Enhanced connection health monitor with reduced frequency to prevent auth conflicts
export const startConnectionMonitor = () => {
  // Prevent multiple connection monitors from running
  if (isConnectionMonitorRunning || connectionMonitorStarted) {
    return () => {}; // Return empty cleanup function
  }
  
  isConnectionMonitorRunning = true;
  connectionMonitorStarted = true;
  let isOnline = navigator.onLine;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3; // Reduced from 5
  let lastSuccessfulCheck = Date.now();
  let isChecking = false; // Prevent multiple simultaneous checks
  let lastCheckTime = 0;
  const minCheckInterval = 60000; // Minimum 1 minute between checks
  let isLoggedOut = false; // Track logout state
  
  const checkConnection = async () => {
    const now = Date.now();
    
    // Check if user is logged out - stop monitoring if so
    const user = localStorage.getItem('user');
    if (!user) {
      isLoggedOut = true;
      return false;
    }
    
    // Prevent too frequent checks
    if (now - lastCheckTime < minCheckInterval) {
      return false;
    }
    
    if (isChecking) {
      return false;
    }
    
    isChecking = true;
    lastCheckTime = now;
    
    try {
      // Use a simpler ping test that doesn't trigger auth events
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
        },
        signal: AbortSignal.timeout(5000) // Increased timeout to 5 seconds
      });
      
        if (response.ok || response.status === 404) { // 404 is OK for root endpoint
          isOnline = true;
          reconnectAttempts = 0;
          lastSuccessfulCheck = Date.now();
          
          // Only dispatch connection status if user is still logged in
          if (!isLoggedOut) {
            window.dispatchEvent(new CustomEvent('supabase-connection-status', { 
              detail: { connected: true, timestamp: Date.now() } 
            }));
          }
          return true;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        } catch (error) {
          isOnline = false;
          reconnectAttempts++;
          console.warn(`❌ Supabase connection failed (attempt ${reconnectAttempts}):`, error);
          
          // Only dispatch connection status if user is still logged in
          if (!isLoggedOut) {
            window.dispatchEvent(new CustomEvent('supabase-connection-status', { 
              detail: { connected: false, error, timestamp: Date.now() } 
            }));
          }
          
          if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
          }
        } finally {
          isChecking = false;
        }
    
    return false;
  };
  
  // Check connection every 2 minutes (increased from 30 seconds to reduce auth conflicts)
  const interval = setInterval(checkConnection, 120000);
  
  // Listen for online/offline events
  const handleOnline = () => {
    // Delay online check to avoid conflicts with auth
    setTimeout(checkConnection, 5000);
  };
  
      const handleOffline = () => {
        isOnline = false;
        // Only dispatch connection status if user is still logged in
        if (!isLoggedOut) {
          window.dispatchEvent(new CustomEvent('supabase-connection-status', { 
            detail: { connected: false, offline: true, timestamp: Date.now() } 
          }));
        }
      };
  
  // Enhanced visibility change handling with longer delay
  const handleVisibilityChange = () => {
    if (!document.hidden && Date.now() - lastSuccessfulCheck > 120000 && !isLoggedOut) { // Only check after 2 minutes and if not logged out
      setTimeout(checkConnection, 10000); // Delay by 10 seconds
    }
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Initial check (delayed to avoid conflicts with auth)
  setTimeout(checkConnection, 10000); // Increased delay to 10 seconds
  
  // Return cleanup function
  const cleanup = () => {
    isConnectionMonitorRunning = false;
    connectionMonitorStarted = false;
    isLoggedOut = true; // Mark as logged out
    clearInterval(interval);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    // Dispatch final connection status to clear any error states
    window.dispatchEvent(new CustomEvent('supabase-connection-status', { 
      detail: { connected: true, loggedOut: true, timestamp: Date.now() } 
    }));
  };
  
  connectionMonitorInstance = cleanup;
  return cleanup;
};

// Business Cards service
export const businessCards = {
  getAll: async (userId: string) => {
    try {
      // Get current session to ensure we have valid auth
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        console.error('No session available for business cards query');
        return [];
      }
      
      // Use Supabase client directly instead of proxy
      const { data, error } = await supabase!
        .from('business_cards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting business cards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Connection error getting business cards:', error);
      return [];
    }
  },

  getById: async (id: string) => {
    const { data, error } = await supabase!
      .from('business_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting business card:', error);
      throw error;
    }
    return data;
  },

  getPublic: async (id: string) => {
    const { data, error } = await supabase!
      .from('business_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting public business card:', error);
      throw error;
    }
    return data;
  },

  create: async (cardData: any) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    // Add user_id to cardData
    const cardDataWithUserId = {
      ...cardData,
      user_id: user.id
    };

    const { data, error } = await supabase!
      .from('business_cards')
      .insert(cardDataWithUserId as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating business card:', error);
      console.error('Card data that failed:', JSON.stringify(cardDataWithUserId, null, 2));
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    return data;
  },

  update: async (id: string, updates: any) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    const { data, error } = await (supabase as any)
      .from('business_cards')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own cards
      .select()
      .single();

    if (error) {
      console.error('Error updating business card:', error);
      throw error;
    }
    return data;
  },

  delete: async (id: string) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    const { error } = await supabase!
      .from('business_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only delete their own cards

    if (error) {
      console.error('Error deleting business card:', error);
      throw error;
    }
    return true;
  },
};

// Profiles service
export const profiles = {
  get: async (userId: string) => {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
    return data;
  },

  update: async (userId: string, updates: any) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .eq('id', user.id) // Ensure user can only update their own profile
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    return data;
  },
};

// Contacts service
export const contacts = {
  getAll: async (ownerId: string) => {
    const { data, error } = await supabase!
      .from('contacts')
      .select(`
        *,
        visitor:profiles!contacts_visitor_id_fkey(id, full_name, email, avatar_url),
        card:business_cards!contacts_card_id_fkey(id, name, job_title, company)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting contacts:', error);
      throw error;
    }
    return data;
  },

  create: async (contactData: any) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    // Add owner_id to contactData
    const contactDataWithOwnerId = {
      ...contactData,
      owner_id: user.id
    };

    const { data, error } = await supabase!
      .from('contacts')
      .insert(contactDataWithOwnerId as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
    return data;
  },

  delete: async (id: string) => {
    // Get current user
    const { data: { user }, error: userError } = await supabase!.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    const { error } = await supabase!
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id); // Ensure user can only delete their own contacts

    if (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
    return true;
  },
};

// Card Views service
export const cardViews = {
  track: async (cardId: string, deviceInfo: string) => {
    const { data, error } = await supabase!
      .from('card_views')
      .insert({
        card_id: cardId,
        viewer_ip: 'unknown',
        device_info: deviceInfo,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error tracking card view:', error);
      throw error;
    }
    return data;
  },

  getByCardId: async (cardId: string) => {
    const { data, error } = await supabase!
      .from('card_views')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting card views:', error);
      throw error;
    }
    return data;
  },

  getStats: async (cardId: string) => {
    const { data, error } = await supabase!
      .from('card_views')
      .select('*')
      .eq('card_id', cardId);

    if (error) {
      console.error('Error getting card view stats:', error);
      throw error;
    }
    
    const views = data as any[] || [];
    const totalViews = views.length;
    const uniqueViews = new Set(views.map(view => view.viewer_ip)).size;
    const todayViews = views.filter(view => {
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
    const { data, error } = await supabase!
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase!
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting template:', error);
      throw error;
    }
    return data;
  },
};

// QR Code service
export const qrCode = {
  generate: async (cardId: string) => {
    const { data, error } = await supabase!.functions.invoke('generate-qr', {
      body: { cardId },
    });

    if (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
    return data;
  },
};

// vCard service
export const vCard = {
  generate: async (cardId: string) => {
    const { data, error } = await supabase!.functions.invoke('generate-vcard', {
      body: { cardId },
    });

    if (error) {
      console.error('Error generating vCard:', error);
      throw error;
    }
    return data;
  },
};