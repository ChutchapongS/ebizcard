import { vCard } from '../services/supabase';

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
    // For React Native, you would use a library like react-native-fs
    // or expo-file-system to download the file
    console.log('Downloading vCard:', filename);
    // Implementation would depend on the specific file system library used
  } catch (error) {
    console.error('Error downloading vCard:', error);
    throw error;
  }
};