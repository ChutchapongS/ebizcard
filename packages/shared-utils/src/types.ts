/**
 * Platform-specific service interface for Supabase functions
 */
export interface SupabaseService {
  functions: {
    invoke: (functionName: string, options: { body: any }) => Promise<{
      data?: any;
      error?: any;
    }>;
  };
}

/**
 * Platform-specific download handler interface
 */
export interface DownloadHandler {
  downloadVCard: (vCardData: string, filename: string) => Promise<void>;
  downloadQRCode: (qrCodeUrl: string, filename: string) => Promise<void>;
}

