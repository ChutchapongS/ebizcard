'use client';

import { getWebSettings } from '@/lib/api-client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Smartphone, 
  QrCode, 
  Download, 
  BarChart3, 
  Users, 
  Palette,
  Shield,
  Zap
} from 'lucide-react';

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon_url?: string;
}

// Default fallback icons
const defaultIcons: Record<string, any> = {
  'Multi-Platform': Smartphone,
  'QR Code Generation': QrCode,
  'vCard Export': Download,
  'Analytics': BarChart3,
  'Contact Management': Users,
  'Customizable Templates': Palette,
  'Secure & Private': Shield,
  'Real-time Updates': Zap,
};

const defaultFeatures: FeatureItem[] = [
  {
    id: 'feature-1',
    title: 'Multi-Platform',
    description: 'ใช้งานได้ทั้งบนมือถือ (iOS/Android) และเว็บไซต์ พร้อม PWA support',
  },
  {
    id: 'feature-2',
    title: 'QR Code Generation',
    description: 'สร้าง QR Code สำหรับแชร์นามบัตรได้ทันที พร้อมการติดตาม',
  },
  {
    id: 'feature-3',
    title: 'vCard Export',
    description: 'ดาวน์โหลดนามบัตรเป็นไฟล์ .vcf เพื่อเพิ่มใน Contact',
  },
  {
    id: 'feature-4',
    title: 'Analytics',
    description: 'ติดตามการดูนามบัตร จำนวนการสแกน QR และข้อมูลผู้เยี่ยมชม',
  },
];

export const Features = () => {
  const [featuresTitle, setFeaturesTitle] = useState<string>('ฟีเจอร์ครบครัน');
  const [featuresDescription, setFeaturesDescription] = useState<string>(
    'ทุกสิ่งที่คุณต้องการสำหรับการสร้างและจัดการนามบัตรดิจิทัล'
  );
  const [features, setFeatures] = useState<FeatureItem[]>(defaultFeatures);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getWebSettings();
        
        if (data.success && data.settings) {
          if (data.settings.features_title) {
            setFeaturesTitle(data.settings.features_title);
          }
          if (data.settings.features_description) {
            setFeaturesDescription(data.settings.features_description);
          }
          
          // Load features items
          if (data.settings.features_items) {
            try {
              const featuresRaw = data.settings.features_items;
              const parsed = typeof featuresRaw === 'string' ? JSON.parse(featuresRaw) : featuresRaw;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFeatures(parsed);
              }
            } catch (error) {
              console.error('Error parsing features items:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch features settings', error);
      }
    };

    fetchSettings();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('webSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('webSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {featuresTitle}
          </h2>
          {featuresDescription && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {featuresDescription}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const DefaultIcon = defaultIcons[feature.title];
            return (
              <div
                key={feature.id || index}
                className="text-center p-5 sm:p-6 rounded-lg hover:shadow-lg transition-shadow duration-300 bg-white h-full flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon_url ? (
                    <Image
                      src={feature.icon_url}
                      alt={feature.title}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                      sizes="24px"
                      unoptimized
                    />
                  ) : DefaultIcon ? (
                    <DefaultIcon className="w-6 h-6 text-primary-600" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="hidden sm:block text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
