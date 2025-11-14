'use client';

import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface OfflineNoticeProps {
  onRetry?: () => void;
}

export default function OfflineNotice({ onRetry }: OfflineNoticeProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="text-center">
          <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            การเชื่อมต่อขาดหาย
          </h2>
          <p className="text-gray-600 mb-4">
            ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              ลองใหม่อีกครั้ง
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              รีเฟรชหน้าเว็บ
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">วิธีแก้ไขปัญหา:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</li>
                  <li>• ปิด VPN หรือ Proxy หากใช้</li>
                  <li>• ลองรีสตาร์ท Router</li>
                  <li>• เปลี่ยน DNS เป็น 8.8.8.8</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
