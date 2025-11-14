import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

interface UseAddressSyncOptions {
  onAddressChange?: (addresses: any[]) => void;
  onMetadataUpdate?: (metadata: any) => void;
}

export const useAddressSync = ({ onAddressChange, onMetadataUpdate }: UseAddressSyncOptions = {}) => {
  const { user } = useAuth();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadTimeRef = useRef<number>(0);

  const syncUserMetadata = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/sync-user-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const result = await response.json();
        onMetadataUpdate?.(result);
      } else {
        // Log error but don't throw to prevent infinite loops
        console.warn('Sync user metadata failed:', response.status, response.statusText);
      }
    } catch (error) {
      // Log error but don't throw to prevent infinite loops
      console.warn('Error syncing user metadata:', error);
    }
  }, [user?.id, onMetadataUpdate]);

  const loadAddresses = useCallback(async () => {
    if (!user?.id) return;

    // Debounce: prevent calls within 5 seconds of each other
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 5000) {
      return;
    }
    lastLoadTimeRef.current = now;

    try {
      const response = await fetch(`/api/supabase-proxy?table=addresses&user_id=${user.id}`);
      
      if (response.ok) {
        const addresses = await response.json();
        if (onAddressChange) {
          onAddressChange(addresses || []);
        }
      } else {
        console.error('Failed to load addresses, status:', response.status);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  }, [user?.id, onAddressChange]);

  // Use polling instead of realtime to reduce resource usage
  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    loadAddresses();
    // Temporarily disabled sync to prevent 500 errors
    // syncUserMetadata();

    // Set up polling every 60 seconds (increased from 30 seconds)
    const pollInterval = setInterval(() => {
      loadAddresses();
      // Temporarily disabled sync to prevent 500 errors
      // syncUserMetadata();
    }, 60000); // 60 seconds instead of 30

    return () => {
      clearInterval(pollInterval);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user?.id, loadAddresses]);

  return {
    syncUserMetadata,
    loadAddresses
  };
};
