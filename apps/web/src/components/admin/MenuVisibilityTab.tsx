'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Eye, 
  EyeOff, 
  Save,
  AlertCircle,
  CheckCircle2,
  Users,
  UserCheck,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuVisibilityTabProps {
  userRole: string;
}

interface MenuVisibility {
  [key: string]: {
    [role: string]: boolean;
  };
}

const defaultMenuVisibility: MenuVisibility = {
  'dashboard': {
    'owner': true,
    'admin': true,
    'user': true,
  },
  'theme-customization': {
    'owner': true,
    'admin': true,
    'user': true,
  },
  'settings': {
    'owner': true,
    'admin': true,
    'user': true,
  },
  'admin-settings': {
    'owner': true,
    'admin': true,
    'user': false,
  },
};

export default function MenuVisibilityTab({ userRole }: MenuVisibilityTabProps) {
  const { session } = useAuth();
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(defaultMenuVisibility);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load menu visibility settings
  useEffect(() => {
    loadMenuVisibility();
  }, []);

  const loadMenuVisibility = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/menu-visibility');
      
      if (!response.ok) {
        throw new Error('Failed to load menu visibility settings');
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        setMenuVisibility(data.settings);
      }
    } catch (error) {
      console.error('Error loading menu visibility:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าการมองเห็นเมนูได้');
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = (menuKey: string, role: string, visible: boolean) => {
    setMenuVisibility(prev => ({
      ...prev,
      [menuKey]: {
        ...prev[menuKey],
        [role]: visible
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/menu-visibility', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: menuVisibility }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save menu visibility settings');
      }

      const data = await response.json();
      
      toast.success('บันทึกการตั้งค่าการมองเห็นเมนูสำเร็จ');
      
      // Notify other components that menu visibility has been updated
      window.dispatchEvent(new CustomEvent('menuVisibilityUpdated'));
      
      // Reload settings to ensure sync
      await loadMenuVisibility();
    } catch (error) {
      console.error('Error saving menu visibility:', error);
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const getMenuDisplayName = (menuKey: string) => {
    const menuNames: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'theme-customization': 'Theme Customization',
      'settings': 'Settings',
      'admin-settings': 'Admin Settings',
    };
    return menuNames[menuKey] || menuKey;
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'owner': 'Owner',
      'admin': 'Admin',
      'user': 'User',
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4" />;
      case 'admin': return <UserCheck className="w-4 h-4" />;
      case 'user': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">การตั้งค่าการมองเห็นเมนู</h2>
        <p className="mt-1 text-sm text-gray-600">
          กำหนดสิทธิ์การมองเห็นเมนูต่างๆ ตาม User Role
        </p>
      </div>

      {/* Menu Visibility Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">การตั้งค่าการมองเห็นเมนู</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เมนู
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(menuVisibility).map(([menuKey, roleSettings]) => (
                <tr key={menuKey} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getMenuDisplayName(menuKey)}
                    </div>
                    <div className="text-sm text-gray-500">
                      /{menuKey}
                    </div>
                  </td>
                  {['owner', 'admin', 'user'].map((role) => (
                    <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleVisibilityChange(menuKey, role, !roleSettings[role])}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          roleSettings[role]
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title={`${roleSettings[role] ? 'ซ่อน' : 'แสดง'} สำหรับ ${getRoleDisplayName(role)}`}
                      >
                        {roleSettings[role] ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">คำอธิบาย</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span>แสดงเมนูสำหรับ Role นี้</span>
              </div>
              <div className="flex items-center">
                <EyeOff className="w-4 h-4 mr-2" />
                <span>ซ่อนเมนูสำหรับ Role นี้</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </div>

      {/* Info Message */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">หมายเหตุ</h3>
            <p className="mt-1 text-sm text-yellow-700">
              การเปลี่ยนแปลงการตั้งค่าจะมีผลทันทีหลังจากบันทึก และจะส่งผลกับผู้ใช้ทั้งหมดในระบบ
              <br />
              <strong>Admin Settings</strong> จะแสดงเฉพาะ Owner และ Admin เท่านั้น
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
