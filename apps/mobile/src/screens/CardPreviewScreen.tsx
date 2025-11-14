import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { BusinessCard } from '../types';

interface CardPreviewScreenProps {
  navigation: any;
  route: {
    params: {
      card: BusinessCard;
    };
  };
}

const CardPreviewScreen = ({ navigation, route }: CardPreviewScreenProps) => {
  const { card } = route.params;
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const generateQRMutation = useMutation({
    mutationFn: async (cardId: string) => {
      // This would call the generate-qr API
      const response = await fetch('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.qrCode);
      setIsGeneratingQR(false);
    },
    onError: (error) => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถสร้าง QR Code ได้');
      setIsGeneratingQR(false);
    },
  });

  const generateVCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const response = await fetch('/api/generate-vcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      return response.blob();
    },
    onSuccess: (blob) => {
      // Handle vCard download
      Alert.alert('สำเร็จ', 'ดาวน์โหลด vCard เรียบร้อยแล้ว');
    },
    onError: (error) => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถดาวน์โหลด vCard ได้');
    },
  });

  const handleGenerateQR = () => {
    setIsGeneratingQR(true);
    generateQRMutation.mutate(card.id);
  };

  const handleDownloadVCard = () => {
    generateVCardMutation.mutate(card.id);
  };

  const handleShare = async () => {
    try {
      const publicUrl = `https://your-domain.com/card/${card.id}`;
      await Share.share({
        message: `ดูนามบัตรดิจิทัลของ ${card.name}: ${publicUrl}`,
        url: publicUrl,
      });
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถแชร์ได้');
    }
  };

  const handleCall = () => {
    if (card.phone) {
      Linking.openURL(`tel:${card.phone}`);
    }
  };

  const handleEmail = () => {
    if (card.email) {
      Linking.openURL(`mailto:${card.email}`);
    }
  };

  const handleWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const socialLinks = card.social_links as any || {};

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">ตัวอย่างนามบัตร</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 py-4">
        {/* Card Preview */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              {card.name}
            </Text>
            {card.job_title && (
              <Text className="text-lg text-gray-600 text-center mt-1">
                {card.job_title}
              </Text>
            )}
            {card.company && (
              <Text className="text-gray-500 text-center mt-1">
                {card.company}
              </Text>
            )}
          </View>

          {/* Contact Information */}
          <View className="space-y-3">
            {card.phone && (
              <TouchableOpacity
                onPress={handleCall}
                className="flex-row items-center p-3 bg-gray-50 rounded-lg"
              >
                <Ionicons name="call" size={20} color="#3b82f6" />
                <Text className="text-gray-900 ml-3 flex-1">{card.phone}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {card.email && (
              <TouchableOpacity
                onPress={handleEmail}
                className="flex-row items-center p-3 bg-gray-50 rounded-lg"
              >
                <Ionicons name="mail" size={20} color="#3b82f6" />
                <Text className="text-gray-900 ml-3 flex-1">{card.email}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}

            {card.address && (
              <View className="flex-row items-start p-3 bg-gray-50 rounded-lg">
                <Ionicons name="location" size={20} color="#3b82f6" />
                <Text className="text-gray-900 ml-3 flex-1">{card.address}</Text>
              </View>
            )}

            {/* Social Links */}
            {Object.entries(socialLinks).map(([platform, url]) => {
              if (!url) return null;
              
              const iconMap: { [key: string]: string } = {
                website: 'globe',
                linkedin: 'logo-linkedin',
                twitter: 'logo-twitter',
                facebook: 'logo-facebook',
              };

              return (
                <TouchableOpacity
                  key={platform}
                  onPress={() => handleWebsite(url as string)}
                  className="flex-row items-center p-3 bg-gray-50 rounded-lg"
                >
                  <Ionicons 
                    name={iconMap[platform] as any || 'link'} 
                    size={20} 
                    color="#3b82f6" 
                  />
                  <Text className="text-gray-900 ml-3 flex-1 capitalize">
                    {platform}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* QR Code Section */}
        <View className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-4 text-center">
            QR Code
          </Text>
          
          {qrCodeUrl ? (
            <View className="items-center">
              <View className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg items-center justify-center mb-4">
                {/* QR Code would be displayed here */}
                <Text className="text-gray-500">QR Code Image</Text>
              </View>
              <Text className="text-gray-600 text-center text-sm">
                สแกนเพื่อดูนามบัตรดิจิทัล
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleGenerateQR}
              disabled={isGeneratingQR}
              className="bg-primary-500 rounded-lg py-4 items-center"
            >
              <Text className="text-white text-lg font-semibold">
                {isGeneratingQR ? 'กำลังสร้าง QR Code...' : 'สร้าง QR Code'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleDownloadVCard}
            disabled={generateVCardMutation.isPending}
            className="bg-green-500 rounded-lg py-4 items-center"
          >
            <View className="flex-row items-center">
              <Ionicons name="download" size={20} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                {generateVCardMutation.isPending ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด vCard'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('CardEditor', { card })}
            className="bg-gray-500 rounded-lg py-4 items-center"
          >
            <View className="flex-row items-center">
              <Ionicons name="create" size={20} color="white" />
              <Text className="text-white text-lg font-semibold ml-2">
                แก้ไขนามบัตร
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CardPreviewScreen;
