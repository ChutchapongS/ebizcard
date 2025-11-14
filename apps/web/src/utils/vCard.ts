import { vCard } from '@/lib/supabase/client';

export const generateVCard = async (cardId: string) => {
  try {
    const data = await vCard.generate(cardId);
    return data;
  } catch (error) {
    console.error('Error generating vCard:', error);
    throw error;
  }
};

export const downloadVCard = async (vCardData: string, filename: string) => {
  try {
    const blob = new Blob([vCardData], { type: 'text/vcard' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading vCard:', error);
    throw error;
  }
};