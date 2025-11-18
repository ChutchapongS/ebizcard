import { generateQRCode as generateQRCodeShared, downloadQRCode as downloadQRCodeShared } from '@ebizcard/shared-utils';
import { supabase } from '@/lib/supabase/client';
import type { SupabaseService, DownloadHandler } from '@ebizcard/shared-utils';

// Create Supabase service adapter
const supabaseService: SupabaseService = {
  functions: {
    invoke: async (functionName: string, options: { body: any }) => {
      const { data, error } = await supabase!.functions.invoke(functionName, {
        body: options.body,
      });
      return { data, error };
    },
  },
};

// Platform-specific download handler for Web
const downloadHandler: DownloadHandler = {
  downloadVCard: async (vCardData: string, filename: string) => {
    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  downloadQRCode: async (qrCodeUrl: string, filename: string) => {
    const response = await fetch(qrCodeUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

/**
 * Generate QR Code image URL for a business card
 * 
 * Uses shared business logic from @ebizcard/shared-utils to generate a QR code
 * that links to the public view of the business card. The QR code is generated
 * via Supabase Edge Function and returns a URL to the QR code image.
 * 
 * @param {string} cardId - The unique identifier of the business card
 * @returns {Promise<string>} Promise that resolves to QR code image URL
 * 
 * @throws {Error} If cardId is invalid or QR code generation fails
 * 
 * @example
 * ```typescript
 * const qrCodeUrl = await generateQRCode('card-123');
 * // qrCodeUrl is a URL to the QR code image (e.g., 'https://.../qr-code.png')
 * ```
 */
export const generateQRCode = async (cardId: string) => {
  return generateQRCodeShared(cardId, supabaseService);
};

/**
 * Download QR Code image to user's device (Web platform)
 * 
 * Fetches the QR code image from the provided URL and triggers a browser download.
 * This is the web-specific implementation of the download functionality.
 * 
 * @param {string} qrCodeUrl - The URL of the QR code image to download
 * @param {string} filename - The desired filename for the downloaded file (e.g., 'qr-code.png')
 * @returns {Promise<void>} Promise that resolves when download is initiated
 * 
 * @example
 * ```typescript
 * const qrCodeUrl = await generateQRCode('card-123');
 * await downloadQRCode(qrCodeUrl, 'my-qr-code.png');
 * // QR code image will be downloaded to user's default download folder
 * ```
 */
export const downloadQRCode = async (qrCodeUrl: string, filename: string) => {
  return downloadQRCodeShared(qrCodeUrl, filename, downloadHandler);
};
