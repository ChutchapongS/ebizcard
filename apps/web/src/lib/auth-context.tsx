'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, stopConnectionMonitor } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConnected: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithLinkedIn: () => Promise<{ data: any; error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updateProfile: (updates: { 
    full_name?: string; 
    full_name_english?: string;
    avatar_url?: string;
    profile_image?: string;
    personal_phone?: string;
    company_logo?: string;
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
    addresses?: any[];
  }) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * React Hook: useAuth
 * 
 * Provides access to the authentication context including user, session, and auth methods.
 * This hook must be used within an AuthProvider component.
 * 
 * @returns {AuthContextType} The authentication context containing:
 *   - user: Current authenticated user or null
 *   - session: Current session or null
 *   - isAuthenticated: Boolean indicating if user is authenticated
 *   - isLoading: Boolean indicating if auth state is being loaded
 *   - isConnected: Boolean indicating Supabase connection status
 *   - signIn: Function to sign in with email/password
 *   - signUp: Function to sign up new user
 *   - signOut: Function to sign out current user
 *   - signInWithGoogle: Function to sign in with Google OAuth
 *   - signInWithLinkedIn: Function to sign in with LinkedIn OAuth
 *   - resetPassword: Function to reset user password
 *   - updateProfile: Function to update user profile
 * 
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, isAuthenticated, signIn, signOut } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onSignIn={signIn} />;
 *   }
 *   
 *   return <div>Welcome, {user?.email}</div>;
 * }
 * ```
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Helper function to check if we have valid Supabase credentials
 * 
 * Validates that Supabase environment variables are set and not using demo values.
 * 
 * @returns {boolean} True if valid credentials are configured, false otherwise
 * @private
 */
const hasValidSupabaseCredentials = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://demo.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'demo_key' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 50;
};

/**
 * React Component: AuthProvider
 * 
 * Provides authentication context to all child components. Manages user session,
 * authentication state, and provides methods for signing in/out and updating profiles.
 * 
 * This component should wrap the entire application or the portion that needs auth access.
 * 
 * @param {AuthProviderProps} props - Component props
 * @param {React.ReactNode} props.children - Child components that need auth access
 * 
 * @returns {JSX.Element} Provider component wrapping children with auth context
 * 
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes>
 *           <Route path="/" element={<HomePage />} />
 *           <Route path="/dashboard" element={<Dashboard />} />
 *         </Routes>
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Get initial session - simplified
    const getInitialSession = async () => {
      try {
        // Check if we have valid Supabase credentials
        const hasValidCredentials = hasValidSupabaseCredentials();
        
        if (!hasValidCredentials) {
          console.warn('AuthProvider: No valid Supabase credentials, using mock auth');
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsConnected(false);
            setIsLoading(false);
          }
          return;
        }
        
        const { data: { session }, error } = await supabase?.auth.getSession() || { data: { session: null }, error: null };
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user || null);
          setIsConnected(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsConnected(false);
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes - only if we have valid credentials
    let subscription: any = null;
    
    if (hasValidSupabaseCredentials()) {
      const authStateChangeResult = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!isMounted) return;
          
          // Skip auth state changes if we're logging out
          if (isLoggingOut) {
            console.log('Auth state change ignored - logging out');
            return;
          }
        
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsConnected(false);
          setIsLoading(false);
          setIsLoggingOut(false); // Reset logging out state
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user || null);
          setIsConnected(true);
          setIsLoading(false);
          setIsLoggingOut(false); // Reset logging out state
        } else {
          setSession(session);
          setUser(session?.user || null);
          setIsConnected(true);
          setIsLoading(false);
          setIsLoggingOut(false); // Reset logging out state
        }
      }
    );
      subscription = authStateChangeResult?.data?.subscription;
    } else {
      console.warn('No valid Supabase credentials, skipping auth state listener');
    }

    return () => {
      isMounted = false;
      if (subscription) {
      subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Check if we have valid Supabase credentials first
      const hasValidCredentials = hasValidSupabaseCredentials();
      
      if (!hasValidCredentials) {
        console.warn('No valid Supabase credentials, cannot sign in');
        return { 
          data: null, 
          error: { message: 'Supabase credentials not configured. Please set up your .env.local file.' } 
        };
      }

      const result = await supabase?.auth.signInWithPassword({
      email,
      password,
    });
      return { data: result?.data || null, error: result?.error || null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { 
        data: null, 
        error: { message: 'Connection error. Please check your internet connection.' } 
      };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // Check if we have valid Supabase credentials first
      const hasValidCredentials = hasValidSupabaseCredentials();
      
      if (!hasValidCredentials) {
        console.warn('No valid Supabase credentials, cannot sign up');
        return { 
          data: null, 
          error: { message: 'Supabase credentials not configured. Please set up your .env.local file.' } 
        };
      }

      const result = await supabase?.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
      return { data: result?.data || null, error: result?.error || null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { 
        data: null, 
        error: { message: 'Connection error. Please check your internet connection.' } 
      };
    }
  };

  const signOut = async () => {
    try {
      // Set logging out flag FIRST to prevent auth state changes
      setIsLoggingOut(true);
      
      // Clear local state first (like FigureFest)
      setSession(null);
      setUser(null);
      setIsConnected(false);
      setIsLoading(false);
      
      // Clear localStorage and sessionStorage
      localStorage.removeItem('user');
      localStorage.removeItem('redirect-after-reload');
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear Supabase session from browser
      if (typeof window !== 'undefined') {
        // Clear all cookies related to Supabase
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      
      // Check if we have valid Supabase credentials
      const hasValidCredentials = hasValidSupabaseCredentials();
      
      if (!hasValidCredentials) {
        console.warn('No valid Supabase credentials, local state cleared');
        return { error: null };
      }

      // Call Supabase signOut
      const result = await supabase?.auth.signOut();
      const error = result?.error;
      
      if (error) {
        console.warn('Supabase signOut error, but local state already cleared:', error);
      }
      
      // Force clear state even if Supabase fails (like FigureFest)
      setSession(null);
      setUser(null);
      setIsConnected(false);
      setIsLoading(false);
      
      // Stop connection monitor first
      stopConnectionMonitor();
      
      // Clear Supabase session completely
      if (typeof window !== 'undefined') {
        // Clear Supabase session from memory
        await supabase?.auth.signOut({ scope: 'global' });
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear IndexedDB if exists
        if ('indexedDB' in window) {
          try {
            indexedDB.deleteDatabase('supabase');
          } catch (e) {
            console.log('Could not clear IndexedDB:', e);
          }
        }
      }
      
      // Force clear state one more time to ensure it's cleared
      setSession(null);
      setUser(null);
      setIsConnected(false);
      setIsLoading(false);
      
      // Reset logging out flag immediately
      setIsLoggingOut(false);
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout even if there's an error (like FigureFest)
      setSession(null);
      setUser(null);
      setIsConnected(false);
      setIsLoading(false);
      
      // Stop connection monitor first
      stopConnectionMonitor();
      
      // Clear all storage and session
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear Supabase session completely
      if (typeof window !== 'undefined') {
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear IndexedDB if exists
        if ('indexedDB' in window) {
          try {
            indexedDB.deleteDatabase('supabase');
          } catch (e) {
            console.log('Could not clear IndexedDB:', e);
          }
        }
      }
      
      // Reset logging out flag immediately
      setIsLoggingOut(false);
      
      return { error: null };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await supabase?.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      const data = result?.data || null;
      const error = result?.error || null;
      
      if (error && error.message.includes('provider is not enabled')) {
        // Show user-friendly message
        alert('Google OAuth ยังไม่ได้เปิดใช้งาน กรุณาใช้การเข้าสู่ระบบด้วยอีเมลแทน');
        return { data: null, error: { message: 'Google OAuth not enabled' } };
      }
      
      return { data, error };
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
      return { data: null, error };
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      const result = await supabase?.auth.signInWithOAuth({
        provider: 'linkedin',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      const data = result?.data || null;
      const error = result?.error || null;
      
      if (error && error.message.includes('provider is not enabled')) {
        // Show user-friendly message
        alert('LinkedIn OAuth ยังไม่ได้เปิดใช้งาน กรุณาใช้การเข้าสู่ระบบด้วยอีเมลแทน');
        return { data: null, error: { message: 'LinkedIn OAuth not enabled' } };
      }
      
      return { data, error };
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
      alert('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LinkedIn');
      return { data: null, error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await supabase?.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
      return { data: result?.data || null, error: result?.error || null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  const updateProfile = async (updates: { 
    full_name?: string; 
    full_name_english?: string;
    avatar_url?: string;
    profile_image?: string;
    personal_phone?: string;
    company_logo?: string;
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
    addresses?: any[];
  }) => {
    if (!user) {
      return { data: null, error: { message: 'No user logged in' } };
    }

    try {
      // Get current session and refresh if needed
      let { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      
      if (!session?.access_token) {
        console.error('No valid session found');
        return { data: null, error: { message: 'No valid session found' } };
      }

      // Check if token is expired and refresh if needed
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now + 60) { // Refresh if expires within 1 minute
        console.log('Token expires soon, refreshing...');
        const result = await supabase?.auth.refreshSession();
        const refreshData = result?.data || null;
        const refreshError = result?.error || null;
        
        if (refreshError) {
          console.error('Failed to refresh session:', refreshError);
          return { data: null, error: { message: 'Failed to refresh session' } };
        }
        
        if (refreshData?.session) {
        session = refreshData.session;
        } else {
          console.error('No session data in refresh response');
          return { data: null, error: { message: 'No session data in refresh response' } };
        }
        console.log('Session refreshed successfully');
      }

      console.log('Updating profile with session:', session?.user?.email);
      console.log('Access token length:', session?.access_token?.length);
      console.log('Token expires at:', session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown');
      console.log('Updates keys:', Object.keys(updates));

      // Filter out large data to reduce payload size
      const filteredUpdates = { ...updates };
      
      // Remove ALL image fields (both base64 and URLs)
      // Images should ONLY be stored in profiles table, not in user_metadata
      if (filteredUpdates.profile_image) {
        delete filteredUpdates.profile_image;
        console.log('Removed profile_image (will save to profiles table only)');
      }
      
      if (filteredUpdates.avatar_url) {
        delete filteredUpdates.avatar_url;
        console.log('Removed avatar_url (will save to profiles table only)');
      }
      
      if (filteredUpdates.company_logo && filteredUpdates.company_logo.startsWith('data:image/')) {
        delete filteredUpdates.company_logo;
        console.log('Removed company_logo to reduce payload size');
      }

      // Limit addresses array size
      if (filteredUpdates.addresses && Array.isArray(filteredUpdates.addresses)) {
        // Keep only first 5 addresses to reduce payload size
        filteredUpdates.addresses = filteredUpdates.addresses.slice(0, 5);
        console.log('Limited addresses to 5 items to reduce payload size');
      }

      // Remove empty strings and null values
      Object.keys(filteredUpdates).forEach(key => {
        const value = (filteredUpdates as any)[key];
        if (value === '' || value === null || value === undefined) {
          delete (filteredUpdates as any)[key];
        }
      });

      console.log('Filtered updates keys:', Object.keys(filteredUpdates));
      console.log('Payload size estimate:', JSON.stringify(filteredUpdates).length, 'characters');

      // Use API route with access token but CORS handled by middleware
      console.log('Using API route with access token for profile update');
      
      // Further reduce payload size by removing large fields
      const minimalUpdates = { ...filteredUpdates };
      
      // Remove addresses if too many (allow up to 5 addresses)
      if (minimalUpdates.addresses && minimalUpdates.addresses.length > 5) {
        minimalUpdates.addresses = minimalUpdates.addresses.slice(0, 5);
        console.log('Limited addresses to 5 items to reduce payload size');
      }
      
      // Remove any fields that might be too large
      delete (minimalUpdates as any).company_logo;
      delete (minimalUpdates as any).profile_image;
      delete (minimalUpdates as any).avatar_url;
      
      console.log('Minimal updates keys:', Object.keys(minimalUpdates));
      console.log('Minimal payload size:', JSON.stringify(minimalUpdates).length, 'characters');
      
      // Check if payload is still too large (over 8KB)
      const payloadSize = JSON.stringify(minimalUpdates).length;
      if (payloadSize > 8192) {
        console.warn('Payload still too large, splitting update...');
        
        // Split into smaller updates
        const basicFields = ['full_name', 'full_name_english', 'personal_phone', 'work_phone', 'work_email', 'company', 'department', 'job_title', 'website'];
        const socialFields = ['facebook', 'line_id', 'linkedin', 'twitter', 'instagram'];
        
        const basicUpdate: any = {};
        const socialUpdate: any = {};
        
        basicFields.forEach(field => {
          if (minimalUpdates[field as keyof typeof minimalUpdates] !== undefined) {
            basicUpdate[field] = minimalUpdates[field as keyof typeof minimalUpdates];
          }
        });
        
        socialFields.forEach(field => {
          if (minimalUpdates[field as keyof typeof minimalUpdates] !== undefined) {
            socialUpdate[field] = minimalUpdates[field as keyof typeof minimalUpdates];
          }
        });
        
        // Update basic fields first
        if (Object.keys(basicUpdate).length > 0) {
          const basicResponse = await fetch('/api/update-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId: user.id,
              updates: basicUpdate 
            }),
          });
          
          if (!basicResponse.ok) {
            throw new Error('Failed to update basic profile fields');
          }
        }
        
        // Update social fields second
        if (Object.keys(socialUpdate).length > 0) {
          const socialResponse = await fetch('/api/update-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId: user.id,
              updates: socialUpdate 
            }),
          });
          
          if (!socialResponse.ok) {
            throw new Error('Failed to update social profile fields');
          }
        }
        
        // Refresh the user session to get updated data
        try {
          const { data: { session: newSession } } = await supabase?.auth.getSession() || { data: { session: null } };
          if (newSession?.user) {
            setUser(newSession.user);
            setSession(newSession);
            console.log('User session refreshed with updated data (split update)');
          }
        } catch (refreshError) {
          console.warn('Failed to refresh user session (split update):', refreshError);
        }
        
        return { data: { success: true }, error: null };
      }
      
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          updates: minimalUpdates,
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          // Handle 431 error or other cases where response is not JSON
          if (response.status === 431) {
            errorData = { 
              error: 'Request too large', 
              message: 'ข้อมูลที่ส่งมีขนาดใหญ่เกินไป กรุณาลองใหม่อีกครั้ง' 
            };
          } else {
            errorData = { 
              error: 'Server error', 
              message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' 
            };
          }
        }
        console.error('API error:', errorData);
        console.error('API error details:', errorData.details);
        return { data: null, error: errorData };
      }

      const data = await response.json();
      console.log('Profile updated successfully via API route');
      
      // Refresh the user session to get updated data
      try {
        const { data: { session: newSession } } = await supabase?.auth.getSession() || { data: { session: null } };
        if (newSession?.user) {
          setUser(newSession.user);
          setSession(newSession);
          console.log('User session refreshed with updated data');
        }
      } catch (refreshError) {
        console.warn('Failed to refresh user session:', refreshError);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error: { message: 'Failed to update profile' } };
    }
  };

      const value: AuthContextType = {
        user: user,
        session: session,
        isAuthenticated: !!user,
        isLoading: isLoading,
        isConnected,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        signInWithLinkedIn,
        resetPassword,
        updateProfile,
      };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};