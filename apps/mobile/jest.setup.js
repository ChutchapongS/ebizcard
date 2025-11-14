import 'react-native-gesture-handler/jestSetup'

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

// Mock Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}))

jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: {
    back: 'back',
    front: 'front',
  },
}))

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: 'BarCodeScanner',
  BarCodeScannerResult: {},
}))

jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
}))

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}))

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}))

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: 'StackNavigator',
    Screen: 'StackScreen',
  }),
}))

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: 'TabNavigator',
    Screen: 'TabScreen',
  }),
}))

// Mock Supabase
jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithOAuth: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
    })),
    functions: {
      invoke: jest.fn(),
    },
  },
  auth: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithLinkedIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
  },
  businessCards: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  profiles: {
    get: jest.fn(),
    update: jest.fn(),
  },
  contacts: {
    getAll: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  cardViews: {
    track: jest.fn(),
    getByCardId: jest.fn(),
    getStats: jest.fn(),
  },
  templates: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
  qrCode: {
    generate: jest.fn(),
  },
  vCard: {
    generate: jest.fn(),
  },
}))

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.EXPO_PUBLIC_SITE_URL = 'https://test.com'

// Mock Alert
global.Alert = {
  alert: jest.fn(),
}

// Mock Share
jest.mock('react-native-share', () => ({
  share: jest.fn(),
}))

// Mock QR Code
jest.mock('react-native-qrcode-svg', () => 'QRCode')

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}))

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
  PanGestureHandler: 'PanGestureHandler',
  State: {},
}))

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')
  Reanimated.default.call = () => {}
  return Reanimated
})