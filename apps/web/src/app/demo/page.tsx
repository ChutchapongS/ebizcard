'use client';

import React, { useState } from 'react';
import { DemoCardView } from '@/components/card/DemoCardView';
import { Navbar } from '@/components/layout/Navbar';
import { 
  ArrowLeft, 
  Smartphone, 
  Globe, 
  QrCode,
  Download,
  Share2,
  Eye
} from 'lucide-react';

const demoCard = {
  id: 'demo-card-1',
  name: 'สมชาย ใจดี',
  job_title: 'Software Engineer',
  company: 'Tech Company Co., Ltd.',
  phone: '+66 81-234-5678',
  email: 'somchai@example.com',
  address: '123 ถนนสุขุมวิท กรุงเทพมหานคร 10110',
  social_links: {
    website: 'https://somchai.dev',
    linkedin: 'https://linkedin.com/in/somchai',
    twitter: 'https://twitter.com/somchai',
    facebook: 'https://facebook.com/somchai',
  },
  theme: 'default',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export default function DemoPage() {
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  const handleGenerateQR = () => {
    console.log('Demo QR Code generation clicked');
    setShowQRGenerator(!showQRGenerator);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ตัวอย่างนามบัตรดิจิทัล</h1>
                <p className="text-gray-600">ดูตัวอย่างการทำงานของแพลตฟอร์ม</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">นามบัตรดิจิทัล</h2>
              <div className="flex justify-center">
                <DemoCardView card={demoCard} />
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ฟีเจอร์หลัก</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Smartphone className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">รองรับทุกอุปกรณ์</h3>
                    <p className="text-sm text-gray-600">
                      ดูนามบัตรได้บนมือถือ แท็บเล็ต และคอมพิวเตอร์
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <QrCode className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">QR Code</h3>
                    <p className="text-sm text-gray-600">
                      สร้าง QR Code เพื่อแชร์นามบัตรได้ง่ายๆ
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">vCard Export</h3>
                    <p className="text-sm text-gray-600">
                      ดาวน์โหลดนามบัตรเป็นไฟล์ vCard
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Share2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">แชร์ง่าย</h3>
                    <p className="text-sm text-gray-600">
                      แชร์นามบัตรผ่านลิงก์หรือ QR Code
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Globe className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">ลิงก์โซเชียล</h3>
                    <p className="text-sm text-gray-600">
                      เชื่อมต่อกับเว็บไซต์และโซเชียลมีเดีย
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Generator Demo */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code Generator</h2>
              <div className="text-center">
                {showQRGenerator ? (
                  <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto bg-black grid grid-cols-8 gap-1 p-2">
                        {Array.from({ length: 64 }, (_, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3 ${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">QR Code ตัวอย่าง</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <button 
                  onClick={handleGenerateQR}
                  className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center mx-auto"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  {showQRGenerator ? 'ซ่อน QR Code' : 'สร้าง QR Code'}
                </button>
                <p className="text-gray-600 text-sm mt-4">
                  QR Code จะปรากฏที่นี่เมื่อคุณคลิกปุ่มด้านบน
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">วิธีการใช้งาน</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">สร้างบัญชี</h3>
                    <p className="text-sm text-gray-600">
                      สมัครสมาชิกและเข้าสู่ระบบ
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">สร้างนามบัตร</h3>
                    <p className="text-sm text-gray-600">
                      กรอกข้อมูลและออกแบบนามบัตร
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">แชร์นามบัตร</h3>
                    <p className="text-sm text-gray-600">
                      แชร์ผ่านลิงก์หรือ QR Code
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">ติดตามผล</h3>
                    <p className="text-sm text-gray-600">
                      ดูสถิติการเข้าชมและติดต่อ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">พร้อมเริ่มต้นแล้วหรือยัง?</h3>
              <p className="text-primary-100 mb-4">
                สร้างนามบัตรดิจิทัลของคุณวันนี้
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.href = '/auth/register'}
                  className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  สมัครสมาชิก
                </button>
                <button
                  onClick={() => window.location.href = '/auth/login'}
                  className="border border-white text-white px-6 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}