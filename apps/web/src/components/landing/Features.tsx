'use client';

import React from 'react';
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

const features = [
  {
    icon: Smartphone,
    title: 'Multi-Platform',
    description: 'ใช้งานได้ทั้งบนมือถือ (iOS/Android) และเว็บไซต์ พร้อม PWA support'
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description: 'สร้าง QR Code สำหรับแชร์นามบัตรได้ทันที พร้อมการติดตาม'
  },
  {
    icon: Download,
    title: 'vCard Export',
    description: 'ดาวน์โหลดนามบัตรเป็นไฟล์ .vcf เพื่อเพิ่มใน Contact'
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'ติดตามการดูนามบัตร จำนวนการสแกน QR และข้อมูลผู้เยี่ยมชม'
  },
  {
    icon: Users,
    title: 'Contact Management',
    description: 'จัดการรายชื่อผู้ติดต่อที่สแกน QR Code ของคุณ'
  },
  {
    icon: Palette,
    title: 'Customizable Templates',
    description: 'เลือกธีมสำเร็จรูปหรือปรับแต่งสีและรูปแบบตามต้องการ'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'ข้อมูลปลอดภัยด้วย Supabase และ Row Level Security'
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'อัปเดตข้อมูลแบบ real-time พร้อมการแจ้งเตือน'
  }
];

export const Features = () => {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ฟีเจอร์ครบครัน
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ทุกสิ่งที่คุณต้องการสำหรับการสร้างและจัดการนามบัตรดิจิทัล
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
