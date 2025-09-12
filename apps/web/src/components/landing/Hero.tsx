'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Smartphone, Globe, QrCode } from 'lucide-react';

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            สร้างนามบัตรดิจิทัล
            <span className="block text-primary-600">ที่ทันสมัย</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            แพลตฟอร์มสร้างและแชร์นามบัตรดิจิทัลที่ครบครัน 
            พร้อม QR Code, Analytics และการจัดการที่ง่ายดาย
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/login"
              className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2"
            >
              เริ่มต้นใช้งาน
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="/demo"
              className="btn-secondary text-lg px-8 py-4"
            >
              ดูตัวอย่าง
            </Link>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mobile & Web
              </h3>
              <p className="text-gray-600">
                ใช้งานได้ทั้งบนมือถือและเว็บไซต์
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                QR Code
              </h3>
              <p className="text-gray-600">
                สร้าง QR Code สำหรับแชร์นามบัตร
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Public Pages
              </h3>
              <p className="text-gray-600">
                หน้าแสดงนามบัตรแบบ responsive
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>
    </div>
  );
};
