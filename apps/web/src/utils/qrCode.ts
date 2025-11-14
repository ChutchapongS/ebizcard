import { qrCode } from '@/lib/supabase/client';

export const generateQRCode = async (cardId: string) => {
  try {
    const data = await qrCode.generate(cardId);
    return data;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const downloadQRCode = async (qrCodeUrl: string, filename: string) => {
  try {
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
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};
