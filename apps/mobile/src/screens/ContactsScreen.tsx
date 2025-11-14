import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { contacts } from '../services/supabase';

interface Contact {
  id: string;
  visitor: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  card: {
    id: string;
    name: string;
    job_title?: string;
    company?: string;
  };
  created_at: string;
}

const ContactsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: contactsList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: () => contacts.getAll(user?.id || ''),
    enabled: !!user?.id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    setRefreshing(false);
  };

  const handleContactPress = (contact: Contact) => {
    Alert.alert(
      'ข้อมูลผู้ติดต่อ',
      `ชื่อ: ${contact.visitor.full_name}\nอีเมล: ${contact.visitor.email}\nนามบัตร: ${contact.card.name}`,
      [{ text: 'ตกลง' }]
    );
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
      onPress={() => handleContactPress(item)}
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-4">
          {item.visitor.avatar_url ? (
            <Ionicons name="person" size={24} color="#3b82f6" />
          ) : (
            <Ionicons name="person-outline" size={24} color="#3b82f6" />
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {item.visitor.full_name}
          </Text>
          <Text className="text-gray-600 text-sm">
            {item.visitor.email}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">
            สแกนนามบัตร: {item.card.name}
          </Text>
        </View>
        
        <View className="items-end">
          <Text className="text-gray-400 text-xs">
            {new Date(item.created_at).toLocaleDateString('th-TH')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-gray-900">ผู้ติดต่อ</Text>
          <Text className="text-gray-600">รายชื่อผู้ที่สแกน QR Code ของคุณ</Text>
        </View>

        {/* Contacts List */}
        {contactsList && contactsList.length > 0 ? (
          <FlatList
            data={contactsList}
            renderItem={renderContact}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-lg mt-4">ยังไม่มีผู้ติดต่อ</Text>
            <Text className="text-gray-400 text-center mt-2">
              เมื่อมีคนสแกน QR Code ของคุณ{'\n'}จะแสดงรายชื่อที่นี่
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ContactsScreen;
