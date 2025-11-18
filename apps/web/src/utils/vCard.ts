import { generateVCard as generateVCardShared, downloadVCard as downloadVCardShared } from '@ebizcard/shared-utils';
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
 * Generate vCard file content for a business card
 * 
 * Uses shared business logic from @ebizcard/shared-utils to generate vCard data
 * by fetching card information from Supabase and formatting it according to vCard 3.0 spec.
 * 
 * @param {string} cardId - The unique identifier of the business card
 * @returns {Promise<string>} Promise that resolves to vCard file content as string
 * 
 * @throws {Error} If cardId is invalid or card cannot be fetched
 * 
 * @example
 * ```typescript
 * const vCardData = await generateVCard('card-123');
 * // vCardData contains formatted vCard string
 * ```
 */
export const generateVCard = async (cardId: string) => {
  return generateVCardShared(cardId, supabaseService);
};

/**
 * Download vCard file to user's device (Web platform)
 * 
 * Creates a downloadable vCard file using browser's download mechanism.
 * This is the web-specific implementation of the download functionality.
 * 
 * @param {string} vCardData - The vCard file content as string
 * @param {string} filename - The desired filename for the downloaded file (e.g., 'contact.vcf')
 * @returns {Promise<void>} Promise that resolves when download is initiated
 * 
 * @example
 * ```typescript
 * const vCardData = await generateVCard('card-123');
 * await downloadVCard(vCardData, 'john-doe.vcf');
 * // File will be downloaded to user's default download folder
 * ```
 */
export const downloadVCard = async (vCardData: string, filename: string) => {
  return downloadVCardShared(vCardData, filename, downloadHandler);
};