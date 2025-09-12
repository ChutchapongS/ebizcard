import React, { useEffect, useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { businessCards } from '../services/supabase';
import { BusinessCard } from '../types';

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: cards,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['businessCards', user?.id],
    queryFn: () => businessCards.getAll(user?.id || ''),
    enabled: !!user?.id,
  });

  const deleteCardMutation = useMutation({
    mutationFn: businessCards.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessCards'] });
      Alert.alert('สำเร็จ', 'ลบนามบัตรเรียบร้อยแล้ว');
    },
    onError: (error) => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบนามบัตรได้');
    },
  });

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบนามบัตรนี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบ', style: 'destructive', onPress: () => deleteCardMutation.mutate(cardId) },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['businessCards'] });
    setRefreshing(false);
  };

  const renderCard = ({ item }: { item: BusinessCard }) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
      onPress={() => navigation.navigate('CardPreview', { card: item })}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{item.name}</Text>
          {item.job_title && (
            <Text className="text-gray-600">{item.job_title}</Text>
          )}
          {item.company && (
            <Text className="text-gray-500 text-sm">{item.company}</Text>
          )}
        </View>
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="p-2"
            onPress={() => navigation.navigate('CardEditor', { card: item })}
          >
            <Ionicons name="create-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={() => handleDeleteCard(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
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
          <Text className="text-2xl font-bold text-gray-900">นามบัตรของฉัน</Text>
          <Text className="text-gray-600">จัดการนามบัตรดิจิทัลของคุณ</Text>
        </View>

        {/* Add Card Button */}
        <TouchableOpacity
          className="bg-primary-500 rounded-lg py-4 items-center mb-4"
          onPress={() => navigation.navigate('CardEditor')}
        >
          <View className="flex-row items-center">
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white text-lg font-semibold ml-2">
              สร้างนามบัตรใหม่
            </Text>
          </View>
        </TouchableOpacity>

        {/* Cards List */}
        {cards && cards.length > 0 ? (
          <FlatList
            data={cards}
            renderItem={renderCard}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="card-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-lg mt-4">ยังไม่มีนามบัตร</Text>
            <Text className="text-gray-400 text-center mt-2">
              เริ่มต้นสร้างนามบัตรดิจิทัลของคุณ
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;
