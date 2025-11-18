'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import type { User, Session } from '@supabase/supabase-js';

interface AuthLog {
  event: string;
  userId?: string;
  email?: string;
  expiresAt?: number;
  timestamp: string;
}

export default function DebugPage() {
  const [isDevelopment, setIsDevelopment] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we're in development mode
    // In production, NEXT_PUBLIC_NODE_ENV won't be set or will be 'production'
    const nodeEnv = process.env.NEXT_PUBLIC_NODE_ENV || 
                    (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'development' : 'production');
    setIsDevelopment(nodeEnv === 'development');
  }, []);

  // Show loading state while checking
  if (isDevelopment === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Disable debug page in production
  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Debug Page Not Available</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get stored logs
    const storedLogs = localStorage.getItem('auth-debug');
    if (storedLogs) {
      setLogs([JSON.parse(storedLogs)]);
    }

    // Get current user and session
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      const { data: { session } } = await supabase!.auth.getSession();
      setUser(user);
      setSession(session);
    };

    getCurrentUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        const logData = {
          event,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at,
          timestamp: new Date().toISOString()
        };
        
        setLogs(prev => [...prev, logData]);
        setUser(session?.user || null);
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const clearLogs = () => {
    localStorage.removeItem('auth-debug');
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Current State */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current State</h2>
            <div className="space-y-2">
              <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
              <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
              <p><strong>Session:</strong> {session ? 'Active' : 'No session'}</p>
              <p><strong>Expires:</strong> {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          {/* Auth Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Auth Logs</h2>
              <button
                onClick={clearLogs}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Clear Logs
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                  <p><strong>Event:</strong> {log.event}</p>
                  <p><strong>Time:</strong> {log.timestamp}</p>
                  <p><strong>User ID:</strong> {log.userId}</p>
                  <p><strong>Email:</strong> {log.email}</p>
                  <p><strong>Expires:</strong> {log.expiresAt ? new Date(log.expiresAt * 1000).toLocaleString() : 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Database Tests */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Database Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/supabase-proxy?table=business_cards&select=count&limit=1');
                  if (!response.ok) {
                    alert(`Connection error: ${response.status}`);
                  } else {
                    alert('Connection successful!');
                  }
                } catch (err) {
                  alert(`Connection failed: ${err}`);
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Connection
            </button>
            <button
              onClick={async () => {
                try {
                  if (!user) {
                    alert('No user authenticated');
                    return;
                  }
                  
                  const response = await fetch(`/api/supabase-proxy?table=business_cards&select=*&user_id=eq.${user.id}&limit=5`);
                  
                  if (!response.ok) {
                    alert(`Business cards error: ${response.status}`);
                  } else {
                    const data = await response.json();
                    alert(`Found ${data?.length || 0} business cards`);
                  }
                } catch (err) {
                  alert(`Business cards failed: ${err}`);
                }
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Business Cards
            </button>
            <button
              onClick={async () => {
                try {
                  if (!user) {
                    alert('No user authenticated');
                    return;
                  }
                  
                  const testCard = {
                    name: 'Test Card',
                    job_title: 'Test Job',
                    company: 'Test Company',
                    email: 'test@example.com',
                    phone: '0123456789',
                    user_id: user.id
                  };

                  const response = await fetch('/api/supabase-proxy?table=business_cards', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testCard),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    alert(`Card creation error: ${errorData.error || response.status}`);
                  } else {
                    const data = await response.json();
                    alert(`Card created successfully: ${data.id}`);
                    
                    // Clean up using proxy
                    await fetch(`/api/supabase-proxy?table=business_cards&id=eq.${data.id}`, {
                      method: 'DELETE',
                    });
                  }
                } catch (err) {
                  alert(`Card creation failed: ${err}`);
                }
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Test Create Card
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => {
                localStorage.removeItem('auth-debug');
                window.location.href = '/auth/login';
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Clear & Go to Login
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Dashboard
            </button>
            <button
              onClick={async () => {
                await supabase!.auth.signOut();
                localStorage.removeItem('auth-debug');
                window.location.href = '/auth/login';
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out & Clear
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
