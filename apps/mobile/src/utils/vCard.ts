import { generateVCard as generateVCardShared, downloadVCard as downloadVCardShared } from '@ebizcard/shared-utils';
import { supabase } from '../services/supabase';
import type { SupabaseService, DownloadHandler } from '@ebizcard/shared-utils';

// Create Supabase service adapter
const supabaseService: SupabaseService = {
  functions: {
    invoke: async (functionName: string, options: { body: any }) => {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: options.body,
      });
      return { data, error };
    },
  },
};

// Platform-specific download handler for React Native
const downloadHandler: DownloadHandler = {
  downloadVCard: async (vCardData: string, filename: string) => {
    // For React Native, you would use a library like react-native-fs
    // or expo-file-system to download the file
    console.log('Downloading vCard:', filename);
    // Implementation would depend on the specific file system library used
    // Example: await FileSystem.writeAsStringAsync(fileUri, vCardData);
  },
  downloadQRCode: async (qrCodeUrl: string, filename: string) => {
    // For React Native, you would use a library like react-native-fs
    // or expo-file-system to download the file
    console.log('Downloading QR code:', qrCodeUrl, filename);
    // Implementation would depend on the specific file system library used
  },
};

/**
 * Generate vCard using shared business logic
 */
export const generateVCard = async (cardId: string) => {
  return generateVCardShared(cardId, supabaseService);
};

/**
 * Download vCard using platform-specific implementation
 */
export const downloadVCard = async (vCardData: string, filename: string) => {
  return downloadVCardShared(vCardData, filename, downloadHandler);
};