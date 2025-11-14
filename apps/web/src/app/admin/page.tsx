'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { 
  Settings, 
  Users, 
  AlertCircle,
  Image as ImageIcon,
  Home as HomeIcon,
  CreditCard,
  FileText,
  Eye,
  Layers
} from 'lucide-react';

// Import components for tabs
import WebSettingsTab from '@/components/admin/WebSettingsTab';
import UserManagementTab from '@/components/admin/UserManagementTab';
import MenuVisibilityTab from '@/components/admin/MenuVisibilityTab';
import LevelCapabilityTab from '@/components/admin/LevelCapabilityTab';

type TabType = 'web-settings' | 'user-management' | 'menu-visibility' | 'level-capability';

export default function AdminPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('web-settings');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user || !session) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch('/api/get-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: session.access_token,
          }),
        });

        const result = await response.json();

        if (result.success && result.profile) {
          const role = result.profile.user_type || 'user';
          setUserRole(role);

          // Check if user has admin or owner role
          if (role !== 'admin' && role !== 'owner') {
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user || (userRole !== 'admin' && userRole !== 'owner')) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-gray-600">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'web-settings' as TabType,
      name: 'Web Setting',
      icon: Settings,
      description: 'จัดการการตั้งค่าเว็บไซต์',
    },
    {
      id: 'user-management' as TabType,
      name: 'User Management',
      icon: Users,
      description: 'จัดการผู้ใช้และสิทธิ์',
    },
    {
      id: 'menu-visibility' as TabType,
      name: 'Menu Visibility',
      icon: Eye,
      description: 'กำหนดสิทธิ์การมองเห็นเมนู',
    },
    {
      id: 'level-capability' as TabType,
      name: 'Level Capability',
      icon: Layers,
      description: 'กำหนดขีดความสามารถตามแผน',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administrator</h1>
          <p className="mt-2 text-gray-600">จัดการระบบและผู้ใช้งาน</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            {/* Desktop: Tab Buttons */}
            <nav className="hidden md:flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-sm font-medium text-center
                      focus:z-10 focus:outline-none transition-colors
                      ${isActive
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </div>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile: Dropdown */}
            <div className="md:hidden px-4 py-3">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'web-settings' && (
              <WebSettingsTab userRole={userRole} />
            )}
            {activeTab === 'user-management' && (
              <UserManagementTab userRole={userRole} />
            )}
            {activeTab === 'menu-visibility' && (
              <MenuVisibilityTab userRole={userRole} />
            )}
            {activeTab === 'level-capability' && (
              <LevelCapabilityTab userRole={userRole} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

