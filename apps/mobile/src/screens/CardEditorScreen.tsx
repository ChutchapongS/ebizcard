import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { businessCards } from '../services/supabase';
import { BusinessCard } from '../types';

interface CardEditorScreenProps {
  navigation: any;
  route: {
    params?: {
      card?: BusinessCard;
    };
  };
}

const CardEditorScreen = ({ navigation, route }: CardEditorScreenProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = !!route.params?.card;
  const existingCard = route.params?.card;

  const [formData, setFormData] = useState({
    name: existingCard?.name || '',
    job_title: existingCard?.job_title || '',
    company: existingCard?.company || '',
    phone: existingCard?.phone || '',
    email: existingCard?.email || '',
    address: existingCard?.address || '',
    social_links: existingCard?.social_links || {},
  });

  const [socialLinks, setSocialLinks] = useState({
    website: (existingCard?.social_links as any)?.website || '',
    linkedin: (existingCard?.social_links as any)?.linkedin || '',
    twitter: (existingCard?.social_links as any)?.twitter || '',
    facebook: (existingCard?.social_links as any)?.facebook || '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const createCardMutation = useMutation({
    mutationFn: businessCards.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCards'] });
      Alert.alert('สำเร็จ', 'สร้างนามบัตรเรียบร้อยแล้ว');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถสร้างนามบัตรได้');
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => businessCards.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCards'] });
      Alert.alert('สำเร็จ', 'อัปเดตนามบัตรเรียบร้อยแล้ว');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปเดตนามบัตรได้');
    },
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อ');
      return;
    }

    setIsLoading(true);
    try {
      const cardData = {
        ...formData,
        social_links: socialLinks,
        user_id: user?.id || '',
      };

      if (isEditing && existingCard) {
        updateCardMutation.mutate({ id: existingCard.id, data: cardData });
      } else {
        createCardMutation.mutate(cardData);
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (field: string, value: string) => {
    setSocialLinks(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900">
            {isEditing ? 'แก้ไขนามบัตร' : 'สร้างนามบัตรใหม่'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            className="bg-primary-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">
              {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Basic Information */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 mb-2">ชื่อ-นามสกุล *</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกชื่อ-นามสกุล"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">ตำแหน่งงาน</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกตำแหน่งงาน"
                  value={formData.job_title}
                  onChangeText={(value) => updateFormData('job_title', value)}
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">บริษัท</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกชื่อบริษัท"
                  value={formData.company}
                  onChangeText={(value) => updateFormData('company', value)}
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">เบอร์โทรศัพท์</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกเบอร์โทรศัพท์"
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">อีเมล</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกอีเมล"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">ที่อยู่</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกที่อยู่"
                  value={formData.address}
                  onChangeText={(value) => updateFormData('address', value)}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Social Links */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">ลิงก์โซเชียล</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 mb-2">เว็บไซต์</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="https://example.com"
                  value={socialLinks.website}
                  onChangeText={(value) => updateSocialLink('website', value)}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">LinkedIn</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="https://linkedin.com/in/username"
                  value={socialLinks.linkedin}
                  onChangeText={(value) => updateSocialLink('linkedin', value)}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">Twitter</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="https://twitter.com/username"
                  value={socialLinks.twitter}
                  onChangeText={(value) => updateSocialLink('twitter', value)}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">Facebook</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="https://facebook.com/username"
                  value={socialLinks.facebook}
                  onChangeText={(value) => updateSocialLink('facebook', value)}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CardEditorScreen;
