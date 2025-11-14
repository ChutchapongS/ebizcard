import { qrCode } from '../services/supabase';

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
    // For React Native, you would use a library like react-native-fs
    // or expo-file-system to download the file
    console.log('Downloading QR code:', qrCodeUrl, filename);
    // Implementation would depend on the specific file system library used
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
};