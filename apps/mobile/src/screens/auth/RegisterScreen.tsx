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

const RegisterScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (password.length < 6) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        Alert.alert('ข้อผิดพลาด', error.message);
      } else {
        Alert.alert(
          'สำเร็จ',
          'สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี',
          [{ text: 'ตกลง', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
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
                สร้างบัญชีใหม่เพื่อเริ่มต้น
              </Text>
            </View>

            {/* Register Form */}
            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 mb-2">ชื่อ-นามสกุล</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

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
                  placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">ยืนยันรหัสผ่าน</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className="bg-primary-500 rounded-lg py-4 items-center"
                onPress={handleRegister}
                disabled={isLoading}
              >
                <Text className="text-white text-lg font-semibold">
                  {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Login Link */}
            <View className="mt-8 items-center">
              <Text className="text-gray-600">
                มีบัญชีแล้ว?{' '}
                <Text
                  className="text-primary-500 font-semibold"
                  onPress={() => navigation.navigate('Login')}
                >
                  เข้าสู่ระบบ
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
