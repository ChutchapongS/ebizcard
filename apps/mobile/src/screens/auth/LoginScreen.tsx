import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithGoogle, signInWithLinkedIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('ข้อผิดพลาด', error.message);
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('ข้อผิดพลาด', error.message);
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithLinkedIn();
      if (error) {
        Alert.alert('ข้อผิดพลาด', error.message);
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6">
          <View className="flex-1 justify-center py-12">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
                <Ionicons name="card" size={40} color="white" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">e-BizCard</Text>
              <Text className="text-gray-600 text-center">
                สร้างและแชร์นามบัตรดิจิทัลของคุณ
              </Text>
            </View>

            {/* Login Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 mb-2">อีเมล</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">รหัสผ่าน</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className="bg-primary-500 rounded-lg py-4 items-center"
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text className="text-white text-lg font-semibold">
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social Login */}
            <View className="mt-8">
              <Text className="text-center text-gray-500 mb-4">หรือเข้าสู่ระบบด้วย</Text>
              
              <TouchableOpacity
                className="border border-gray-300 rounded-lg py-4 items-center mb-3"
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <View className="flex-row items-center">
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text className="text-gray-700 ml-2 font-medium">Google</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="border border-gray-300 rounded-lg py-4 items-center"
                onPress={handleLinkedInLogin}
                disabled={isLoading}
              >
                <View className="flex-row items-center">
                  <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
                  <Text className="text-gray-700 ml-2 font-medium">LinkedIn</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View className="mt-8 items-center">
              <Text className="text-gray-600">
                ยังไม่มีบัญชี?{' '}
                <Text
                  className="text-primary-500 font-semibold"
                  onPress={() => navigation.navigate('Register')}
                >
                  สมัครสมาชิก
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
