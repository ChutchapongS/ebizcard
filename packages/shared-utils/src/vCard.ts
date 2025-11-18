import type { SupabaseService, DownloadHandler } from './types';

/**
 * Generate vCard using Supabase function
 * This is the shared business logic used by both mobile and web apps
 */
export async function generateVCard(
  cardId: string,
  supabaseService: SupabaseService
): Promise<any> {
  try {
    const { data, error } = await supabaseService.functions.invoke('generate-vcard', {
      body: { cardId },
    });

    if (error) {
      console.error('Error generating vCard:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error generating vCard:', error);
    throw error;
  }
}

/**
 * Download vCard - platform-specific implementation
 * This function delegates to the platform-specific download handler
 */
export async function downloadVCard(
  vCardData: string,
  filename: string,
  downloadHandler: DownloadHandler
): Promise<void> {
  try {
    await downloadHandler.downloadVCard(vCardData, filename);
  } catch (error) {
    console.error('Error downloading vCard:', error);
    throw error;
  }
}

