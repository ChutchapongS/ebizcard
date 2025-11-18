import type { SupabaseService, DownloadHandler } from './types';

/**
 * Generate QR Code using Supabase function
 * This is the shared business logic used by both mobile and web apps
 */
export async function generateQRCode(
  cardId: string,
  supabaseService: SupabaseService
): Promise<any> {
  try {
    const { data, error } = await supabaseService.functions.invoke('generate-qr', {
      body: { cardId },
    });

    if (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Download QR Code - platform-specific implementation
 * This function delegates to the platform-specific download handler
 */
export async function downloadQRCode(
  qrCodeUrl: string,
  filename: string,
  downloadHandler: DownloadHandler
): Promise<void> {
  try {
    await downloadHandler.downloadQRCode(qrCodeUrl, filename);
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
}

