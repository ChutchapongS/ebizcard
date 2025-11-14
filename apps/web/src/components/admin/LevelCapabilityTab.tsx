'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Layers, 
  CreditCard,
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  Star,
  Zap,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LevelCapabilityTabProps {
  userRole: string;
}

interface PlanCapability {
  max_cards: number;
  max_templates: number;
  features: string[];
}

interface LevelCapabilities {
  Free: PlanCapability;
  Standard: PlanCapability;
  Pro: PlanCapability;
}

const defaultCapabilities: LevelCapabilities = {
  Free: {
    max_cards: 3,
    max_templates: 2,
    features: [
      'สร้างนามบัตรพื้นฐาน',
      'QR Code',
      'vCard Export',
      '1 ธีม'
    ]
  },
  Standard: {
    max_cards: 10,
    max_templates: 5,
    features: [
      'ทุกฟีเจอร์ของ Free',
      'ธีมเพิ่มเติม (5 ธีม)',
      'Analytics พื้นฐาน',
      'Contact Management'
    ]
  },
  Pro: {
    max_cards: 50,
    max_templates: 20,
    features: [
      'ทุกฟีเจอร์ของ Standard',
      'ธีมไม่จำกัด',
      'Analytics ขั้นสูง',
      'Custom Branding',
      'Priority Support'
    ]
  }
};

export default function LevelCapabilityTab({ userRole }: LevelCapabilityTabProps) {
  const { session } = useAuth();
  const [capabilities, setCapabilities] = useState<LevelCapabilities>(defaultCapabilities);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load level capabilities
  useEffect(() => {
    loadLevelCapabilities();
  }, []);

  const loadLevelCapabilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/level-capabilities');
      
      if (!response.ok) {
        throw new Error('Failed to load level capabilities');
      }
      
      const data = await response.json();
      
      if (data.success && data.capabilities) {
        setCapabilities(data.capabilities);
      }
    } catch (error) {
      console.error('Error loading level capabilities:', error);
      toast.error('ไม่สามารถโหลดการตั้งค่าขีดความสามารถได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCapabilityChange = (plan: keyof LevelCapabilities, field: keyof PlanCapability, value: any) => {
    setCapabilities(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/level-capabilities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capabilities }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save level capabilities');
      }

      const data = await response.json();
      
      toast.success('บันทึกการตั้งค่าขีดความสามารถสำเร็จ');
      
      // Reload settings to ensure sync
      await loadLevelCapabilities();
    } catch (error) {
      console.error('Error saving level capabilities:', error);
      toast.error(error instanceof Error ? error.message : 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setSaving(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'Free': return <CheckCircle2 className="w-5 h-5" />;
      case 'Standard': return <Star className="w-5 h-5" />;
      case 'Pro': return <Crown className="w-5 h-5" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Free': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'Standard': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Pro': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
        <h2 className="text-xl font-semibold text-gray-900">การตั้งค่าขีดความสามารถตามแผน</h2>
        <p className="mt-1 text-sm text-gray-600">
          กำหนดจำนวนนามบัตรสูงสุดและแบบฟอร์มสูงสุดตาม User Plan
        </p>
      </div>

      {/* Plan Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['Free', 'Standard', 'Pro'] as const)
          .map(plan => [plan, capabilities[plan]] as const)
          .map(([plan, capability]) => (
          <div key={plan} className={`border rounded-lg p-6 ${getPlanColor(plan)}`}>
            <div className="flex items-center mb-4">
              {getPlanIcon(plan)}
              <h3 className="ml-2 text-lg font-semibold">{plan}</h3>
            </div>

            {/* Max Cards */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                จำนวนนามบัตรสูงสุด
              </label>
              <input
                type="number"
                value={capability.max_cards}
                onChange={(e) => handleCapabilityChange(plan as keyof LevelCapabilities, 'max_cards', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="1000"
              />
            </div>

            {/* Max Templates */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                จำนวนแบบฟอร์มสูงสุด
              </label>
              <input
                type="number"
                value={capability.max_templates}
                onChange={(e) => handleCapabilityChange(plan as keyof LevelCapabilities, 'max_templates', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="100"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium mb-2">
                ฟีเจอร์ที่รวมอยู่
              </label>
              <div className="space-y-2">
                {capability.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">สรุปขีดความสามารถ</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แผน
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  นามบัตรสูงสุด
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  แบบฟอร์มสูงสุด
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ฟีเจอร์
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(['Free', 'Standard', 'Pro'] as const)
                .map(plan => [plan, capabilities[plan]] as const)
                .map(([plan, capability]) => (
                <tr key={plan} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getPlanIcon(plan)}
                      <span className="ml-2 text-sm font-medium text-gray-900">{plan}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{capability.max_cards}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{capability.max_templates}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-900">{capability.features.length}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">หมายเหตุ</h3>
            <p className="mt-1 text-sm text-blue-700">
              การเปลี่ยนแปลงการตั้งค่าจะมีผลทันทีหลังจากบันทึก
              <br />
              <strong>Admin และ Owner</strong> จะมีสิทธิ์ Pro อัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
