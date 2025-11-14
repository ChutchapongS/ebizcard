'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import OfflineNotice from './OfflineNotice';

export default function ConnectionStatus() {
  const { isConnected, isLoading, user } = useAuth();
  const [showStatus, setShowStatus] = useState(false);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [connectionLostTime, setConnectionLostTime] = useState<Date | null>(null);

  useEffect(() => {
    // Don't show connection status if user is not logged in
    if (!user) {
      setShowStatus(false);
      setShowOfflineModal(false);
      setConnectionLostTime(null);
      return;
    }

    // Show status when connection is lost
    if (!isConnected && !isLoading) {
      setShowStatus(true);
      if (!connectionLostTime) {
        setConnectionLostTime(new Date());
        // Show offline modal after 5 seconds of being offline
        const timer = setTimeout(() => {
          setShowOfflineModal(true);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      // Hide status after 3 seconds when reconnected
      const timer = setTimeout(() => {
        setShowStatus(false);
        setShowOfflineModal(false);
        setConnectionLostTime(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, isLoading, connectionLostTime, user]);

  const handleRetry = () => {
    setShowOfflineModal(false);
    window.location.reload();
  };

  // Don't render anything if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Connection Status Banner */}
      {showStatus && (
        <div className={`fixed top-4 right-4 z-40 transition-all duration-300 ${
          showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
            isConnected 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">เชื่อมต่อแล้ว</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">การเชื่อมต่อขาดหาย</span>
              </>
            )}
          </div>
          
          {!isConnected && (
            <div className="mt-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg p-3 max-w-sm">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้</p>
                  <p className="text-xs mt-1">
                    กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offline Modal */}
      {showOfflineModal && <OfflineNotice onRetry={handleRetry} />}
    </>
  );
}
