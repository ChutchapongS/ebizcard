import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { profiles } from '../services/supabase';

const ProfileScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });

  const {
    data: profile,
    isLoading,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profiles.get(user?.id || ''),
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: profiles.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('สำเร็จ', 'อัปเดตโปรไฟล์เรียบร้อยแล้ว');
      setIsEditing(false);
    },
    onError: (error) => {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปเดตโปรไฟล์ได้');
    },
  });

  React.useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!profileData.full_name.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อ');
      return;
    }

    updateProfileMutation.mutate({
      id: user?.id || '',
      data: profileData,
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'ออกจากระบบ',
      'คุณต้องการออกจากระบบหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ออกจากระบบ', style: 'destructive', onPress: signOut },
      ]
    );
  };

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
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-6">
          <View className="items-center">
            <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text className="text-xl font-semibold text-gray-900">
              {profile?.full_name || 'ผู้ใช้'}
            </Text>
            <Text className="text-gray-600">{profile?.email}</Text>
          </View>
        </View>

        {/* Profile Information */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-gray-900">ข้อมูลโปรไฟล์</Text>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              className="bg-primary-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">
                {isEditing ? 'ยกเลิก' : 'แก้ไข'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-2">ชื่อ-นามสกุล</Text>
              {isEditing ? (
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  value={profileData.full_name}
                  onChangeText={(value) => setProfileData(prev => ({ ...prev, full_name: value }))}
                />
              ) : (
                <Text className="text-gray-900 py-3">{profile?.full_name || '-'}</Text>
              )}
            </View>

            <View>
              <Text className="text-gray-700 mb-2">อีเมล</Text>
              <Text className="text-gray-900 py-3">{profile?.email || '-'}</Text>
            </View>
          </View>

          {isEditing && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-green-500 rounded-lg py-3 items-center mt-4"
            >
              <Text className="text-white font-medium">
                {updateProfileMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Statistics */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">สถิติ</Text>
          
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary-500">0</Text>
              <Text className="text-gray-600 text-sm">นามบัตร</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary-500">0</Text>
              <Text className="text-gray-600 text-sm">ผู้ติดต่อ</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-primary-500">0</Text>
              <Text className="text-gray-600 text-sm">การดู</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่า</Text>
          
          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3">การแจ้งเตือน</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-outline" size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3">ความเป็นส่วนตัว</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
              <Text className="text-gray-900 ml-3">ช่วยเหลือ</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-500 mx-4 mt-4 rounded-lg py-4 items-center"
        >
          <Text className="text-white text-lg font-semibold">ออกจากระบบ</Text>
        </TouchableOpacity>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
