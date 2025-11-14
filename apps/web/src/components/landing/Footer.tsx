'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, X } from 'lucide-react';
import 'react-quill/dist/quill.snow.css';

export const Footer = () => {
  const [footerColor, setFooterColor] = useState<string>('#111827');
  const [footerFontColor, setFooterFontColor] = useState<string>('#ffffff');
  const [siteName, setSiteName] = useState<string>('e-BizCard');
  const [siteDescription, setSiteDescription] = useState<string>(
    'แพลตฟอร์มสร้างและแชร์นามบัตรดิจิทัลที่ทันสมัย พร้อม QR Code และการติดตาม Analytics'
  );
  const [contactEmail, setContactEmail] = useState<string>('hello@ebizcard.com');
  const [contactPhone, setContactPhone] = useState<string>('+66 2-123-4567');
  const [contactAddress, setContactAddress] = useState<string>('กรุงเทพมหานคร, ประเทศไทย');
  const [socialLine, setSocialLine] = useState<string>('');
  const [socialFacebook, setSocialFacebook] = useState<string>('');
  const [socialYoutube, setSocialYoutube] = useState<string>('');
  const [privacyPolicy, setPrivacyPolicy] = useState<string>('');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [modalPrivacyContent, setModalPrivacyContent] = useState<string>('');
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState<boolean>(false);
  const [comingSoonTitle, setComingSoonTitle] = useState<string>('');

  // Sync modal content when modal opens
  useEffect(() => {
    if (isPrivacyModalOpen) {
      // Use privacyPolicy if modalPrivacyContent is empty
      if (!modalPrivacyContent && privacyPolicy) {
        setModalPrivacyContent(privacyPolicy);
      }
    }
  }, [isPrivacyModalOpen, privacyPolicy, modalPrivacyContent]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/web-settings');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.settings) {
            if (data.settings.footer_color) {
              setFooterColor(data.settings.footer_color);
            }
            if (data.settings.footer_font_color) {
              setFooterFontColor(data.settings.footer_font_color);
            }
            if (data.settings.site_name) {
              setSiteName(data.settings.site_name);
            }
            if (data.settings.site_description) {
              setSiteDescription(data.settings.site_description);
            }
            if (data.settings.contact_email) {
              setContactEmail(data.settings.contact_email);
            }
            if (data.settings.contact_phone) {
              setContactPhone(data.settings.contact_phone);
            }
            if (data.settings.contact_address) {
              setContactAddress(data.settings.contact_address);
            }
            if (data.settings.social_line) {
              setSocialLine(data.settings.social_line);
            }
            if (data.settings.social_facebook) {
              setSocialFacebook(data.settings.social_facebook);
            }
            if (data.settings.social_youtube) {
              setSocialYoutube(data.settings.social_youtube);
            }
            if (data.settings.privacy_policy) {
              setPrivacyPolicy(data.settings.privacy_policy);
            } else {
              setPrivacyPolicy('');
            }
          }
        }
      } catch (error) {
        console.warn('Footer: Error loading settings:', error);
      }
    };
    
    loadSettings();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener('webSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('webSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return (
    <footer 
      style={{
        background: footerColor?.startsWith('linear-gradient')
          ? footerColor
          : footerColor || '#111827',
        color: footerFontColor || '#ffffff',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Company Info */}
        <div>
          <h3 className="text-2xl font-bold mb-4" style={{ color: footerFontColor || '#ffffff' }}>{siteName}</h3>
          <p className="mb-6 max-w-md" style={{ color: footerFontColor || '#ffffff', opacity: 0.9 }}>
            {siteDescription}
          </p>

          {/* Contact Info */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
              <span style={{ color: footerFontColor || '#ffffff' }}>{contactEmail}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
              <span style={{ color: footerFontColor || '#ffffff' }}>{contactPhone}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
              <span style={{ color: footerFontColor || '#ffffff' }}>{contactAddress}</span>
            </div>
          </div>

          {/* Social Media */}
          {(socialLine || socialFacebook || socialYoutube) && (
            <div className="flex space-x-4">
              {socialLine && (
                <a
                  href={socialLine}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  title="Line"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.348 0 .63.285.63.63 0 .349-.282.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 5.943 18.615 2.572 12 2.572S0 5.943 0 10.314c0 4.005 4.27 7.452 10.035 8.1.391.082.923.258 1.058.59.12.301.079.766.028 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </a>
              )}
              {socialFacebook && (
                <a
                  href={socialFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  title="Facebook"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {socialYoutube && (
                <a
                  href={socialYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  title="Youtube"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Support Links - Horizontal */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <button 
              onClick={() => {
                setComingSoonTitle('วิธีใช้งาน');
                setIsComingSoonModalOpen(true);
              }}
              className="transition-colors text-sm hover:opacity-80 text-left"
              style={{ color: footerFontColor || '#ffffff' }}
            >
              วิธีใช้งาน
            </button>
            <button 
              onClick={() => {
                setComingSoonTitle('เงื่อนไขการใช้งาน');
                setIsComingSoonModalOpen(true);
              }}
              className="transition-colors text-sm hover:opacity-80 text-left"
              style={{ color: footerFontColor || '#ffffff' }}
            >
              เงื่อนไขการใช้งาน
            </button>
            <Link 
              href="/contact" 
              className="transition-colors text-sm hover:opacity-80"
              style={{ color: footerFontColor || '#ffffff' }}
            >
              ติดต่อเรา
            </Link>
            <button 
              onClick={async () => {
                // Reload settings when opening modal to ensure latest data
                try {
                  const response = await fetch('/api/admin/web-settings');
                  if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.settings?.privacy_policy) {
                      const policyContent = data.settings.privacy_policy;
                      setPrivacyPolicy(policyContent);
                      setModalPrivacyContent(policyContent);
                    } else {
                      setPrivacyPolicy('');
                      setModalPrivacyContent('');
                    }
                  }
                } catch (error) {
                  console.warn('Modal: Error reloading privacy policy:', error);
                }
                setIsPrivacyModalOpen(true);
              }}
              className="transition-colors text-sm hover:opacity-80 text-left"
              style={{ color: footerFontColor || '#ffffff' }}
            >
              นโยบายความเป็นส่วนตัว
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p style={{ color: footerFontColor || '#ffffff', opacity: 0.7 }}>
            © 2025 {siteName}. สงวนลิขสิทธิ์ทั้งหมด
          </p>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setIsPrivacyModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">นโยบายความเป็นส่วนตัว</h2>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                if (modalPrivacyContent && modalPrivacyContent.trim()) {
                  const isHTML = modalPrivacyContent.includes('<') && modalPrivacyContent.includes('>');
                  
                  if (isHTML) {
                    return (
                      <div 
                        className="ql-editor"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                          color: '#111827',
                        }}
                        dangerouslySetInnerHTML={{ __html: modalPrivacyContent }}
                      />
                    );
                  } else {
                    return (
                      <div 
                        className="ql-editor whitespace-pre-wrap"
                        style={{
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          padding: 0,
                          color: '#111827',
                        }}
                      >
                        {modalPrivacyContent}
                      </div>
                    );
                  }
                } else {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500">ยังไม่มีเนื้อหานโยบายความเป็นส่วนตัว</p>
                      <p className="text-sm text-gray-400 mt-2">กรุณาติดต่อผู้ดูแลระบบ</p>
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-xs text-gray-300">
                          <p>Debug: modalPrivacyContent = "{modalPrivacyContent}"</p>
                          <p>privacyPolicy = "{privacyPolicy}"</p>
                          <p>Type: {typeof modalPrivacyContent}</p>
                          <p>Length: {modalPrivacyContent?.length || 0}</p>
                          <p>Trim result: "{modalPrivacyContent?.trim()}"</p>
                        </div>
                      )}
                    </div>
                  );
                }
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {isComingSoonModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={() => setIsComingSoonModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{comingSoonTitle}</h2>
              <button
                onClick={() => setIsComingSoonModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center py-8">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">กำลังพัฒนา</h3>
                <p className="text-gray-600">
                  ฟีเจอร์นี้กำลังอยู่ในขั้นตอนการพัฒนา<br />
                  กรุณาติดตามอัปเดตในอนาคต
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsComingSoonModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
