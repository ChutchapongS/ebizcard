'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CanvasElement as Element } from '../../types/theme-customization';
import QRCodeStyling from 'qr-code-styling';
import { 
  FaPalette, FaStar, FaHeart, FaThumbsUp, FaFire, FaLightbulb,
  FaRocket, FaGem, FaBullseye, FaDumbbell, FaGift,
  FaTrophy, FaHome, FaBuilding, FaStore, FaHospital, FaSchool,
  FaIndustry, FaMobile, FaLaptop, FaCamera, FaMusic, FaFilm,
  FaBook, FaGamepad, FaUser, FaEnvelope, FaPhone, FaGlobe,
  FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaTiktok, FaYoutube, FaTelegram, FaWhatsapp, FaSnapchat, FaPinterest, FaReddit, FaDiscord, FaSlack, FaViber, FaSkype, FaGithub, FaTwitch
} from 'react-icons/fa';
import { MessageCircle, Video } from 'lucide-react';

interface PropertyPanelProps {
  element: Element;
  onElementChange: (element: Element) => void;
  onElementDelete?: (elementId: string) => void;
  onElementClose?: () => void;
  userData?: any;
  useAddressPrefix?: boolean;
  setUseAddressPrefix?: (value: boolean) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  element,
  onElementChange,
  onElementDelete,
  onElementClose,
  userData,
  useAddressPrefix = true,
  setUseAddressPrefix
}) => {
  const [localElement, setLocalElement] = useState<Element>(element);
  const [activePropertyTab, setActivePropertyTab] = useState<'content' | 'style'>('content');
  const iconNameRef = useRef<string>(element.iconName || '');
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const qrLogoUploadRef = useRef<HTMLInputElement>(null);

  // Function to get QR Code styling options based on style
  const getQRCodeStyling = (qrStyle: string, qrColor?: string) => {
    const baseOptions = {
      width: 200,
      height: 200,
      type: 'svg' as const,
      data: '',
      backgroundOptions: {
        color: '#FFFFFF'
      }
    };

    const defaultColor = qrColor || '#000000';
    
    switch (qrStyle) {
      case 'standard':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'square' as const,
            color: defaultColor
          }
        };
      case 'rounded':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'rounded' as const,
            color: defaultColor
          }
        };
      case 'dots':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'dots' as const,
            color: defaultColor
          }
        };
      case 'classy':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'classy' as const,
            color: defaultColor
          }
        };
      case 'classy-rounded':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'classy-rounded' as const,
            color: defaultColor
          }
        };
      case 'extra-rounded':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'extra-rounded' as const,
            color: defaultColor
          }
        };
      case 'custom-corners':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersSquareOptions: {
            type: 'extra-rounded' as const,
            color: defaultColor
          },
          cornersDotOptions: {
            type: 'dot' as const,
            color: defaultColor
          }
        };
      case 'gradient-style':
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'rounded' as const,
            color: defaultColor
          },
          backgroundOptions: {
            color: '#F5F5F5'
          },
          cornersSquareOptions: {
            type: 'square' as const,
            color: defaultColor
          },
          cornersDotOptions: {
            type: 'square' as const,
            color: defaultColor
          }
        };
      default:
        return {
          ...baseOptions,
          dotsOptions: {
            type: 'square' as const,
            color: defaultColor
          }
        };
    }
  };

  // QR Code Preview Component
  const QRCodePreview = ({ qrStyle, qrColor, qrUrl }: { qrStyle: string; qrColor?: string; qrUrl?: string }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (qrRef.current) {
        qrRef.current.innerHTML = ''; // Clear previous content
        
        const stylingOptions = getQRCodeStyling(qrStyle, qrColor);
        
        // Create QR Code options
        const qrOptions: any = {
          ...stylingOptions,
          width: 40,
          height: 40,
          data: qrUrl || 'https://example.com'
        };

        const qrCode = new QRCodeStyling(qrOptions);
        qrCode.append(qrRef.current);
      }
    }, [qrStyle, qrColor, qrUrl]);

    return <div ref={qrRef} className="w-10 h-10 flex items-center justify-center" />;
  };

  useEffect(() => {
    setLocalElement(element);
    iconNameRef.current = element.iconName || '';
  }, [element]);

  const handleContentChange = (content: string) => {
    const updatedElement = { ...localElement, content };
    setLocalElement(updatedElement);
    onElementChange(updatedElement);
  };

  const handleStyleChange = (styleKey: string, value: any) => {
    const updatedElement = {
      ...localElement,
      style: {
        ...localElement.style,
        [styleKey]: value
      }
    };
    setLocalElement(updatedElement);
    onElementChange(updatedElement);
  };

  const handleFieldChange = (field: string) => {
    const updatedElement = { ...localElement, field };
    setLocalElement(updatedElement);
    onElementChange(updatedElement);
  };

  const handleIconNameChange = (iconName: string) => {
    iconNameRef.current = iconName;
        const updatedElement = {
          ...localElement,
      iconName,
      style: {
        ...localElement.style,
        iconName
      }
        };
        setLocalElement(updatedElement);
    onElementChange(updatedElement);
  };

  const handlePositionChange = (positionKey: string, value: number) => {
    const updatedElement = {
      ...localElement,
      iconName: iconNameRef.current || localElement.iconName,
      [positionKey]: value
    };
    setLocalElement(updatedElement);
    onElementChange(updatedElement);
  };

  const handleSizeChange = (sizeKey: string, value: number) => {
    const updatedElement = {
      ...localElement,
      iconName: iconNameRef.current || localElement.iconName,
      [sizeKey]: value
    };
    setLocalElement(updatedElement);
    onElementChange(updatedElement);
  };

  // Get data from userData based on field
  const getFieldData = (field: string) => {
    if (!userData || !field) {
      return '';
    }
    
    // Debug logging
    console.log('🔍 PropertyPanel getFieldData debug:', {
      field,
      hasUserData: !!userData,
      hasMetadata: !!userData.user_metadata,
      personal_address_1_id: userData.user_metadata?.personal_address_1_id,
      hasAddresses: !!userData.addresses,
      addressesLength: userData.addresses?.length || 0,
      addresses: userData.addresses
    });
    
    // Debug specific address lookup
    if (field === 'personalAddress1' && userData.user_metadata?.personal_address_1_id && userData.addresses) {
      const targetId = userData.user_metadata.personal_address_1_id;
      const foundAddress = userData.addresses.find((addr: any) => addr.id === targetId);
      console.log('🔍 personalAddress1 lookup:', {
        targetId,
        foundAddress,
        allAddresses: userData.addresses.map((addr: any) => ({ id: addr.id, type: addr.type })),
        fullAddresses: userData.addresses
      });
      
      // Debug each address individually
      userData.addresses.forEach((addr: any, index: number) => {
        console.log(`🔍 Address ${index}:`, {
          id: addr.id,
          type: addr.type,
          matches: addr.id === targetId,
          address: addr.address,
          district: addr.district,
          province: addr.province
        });
      });
    }
    
    // Debug personalAddress2 lookup
    if (field === 'personalAddress2' && userData.addresses) {
      const address = userData.addresses.find((addr: any) => addr.type === 'personal_2');
      console.log('🔍 personalAddress2 lookup:', {
        foundAddress: address,
        allAddresses: userData.addresses.map((addr: any) => ({ type: addr.type, address: addr.address }))
      });
      
      if (address) {
        console.log('🔍 personalAddress2 address details:', {
          address: address.address,
          district: address.district,
          province: address.province,
          postal_code: address.postal_code,
          postalCode: address.postalCode
        });
      }
    }
    
    // Map field names to userData properties (updated to match page.tsx structure)
    const fieldMap: { [key: string]: string } = {
      'name': userData.name || userData.user_metadata?.full_name || '',
      'nameEn': userData.nameEn || userData.user_metadata?.full_name_english || '',
      'personalPhone': userData.personalPhone || userData.user_metadata?.personal_phone || '',
      'personalEmail': userData.personalEmail || userData.user_metadata?.personal_email || '',
      'workName': userData.workName || userData.user_metadata?.company || '',
      'workDepartment': userData.workDepartment || userData.user_metadata?.department || '',
      'workPosition': userData.workPosition || userData.user_metadata?.job_title || '',
      'workPhone': userData.workPhone || userData.user_metadata?.work_phone || '',
      'workEmail': userData.workEmail || userData.user_metadata?.work_email || '',
      'workWebsite': userData.workWebsite || userData.user_metadata?.website || '',
      'taxIdMain': userData.taxIdMain || userData.user_metadata?.tax_id_main || '',
      'taxIdBranch': userData.taxIdBranch || userData.user_metadata?.tax_id_branch || '',
      'address': userData.address || userData.user_metadata?.addresses?.[0]?.address || '',
      // New address fields
      'personalAddress1': (() => {
        if (userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.type === 'personal_1');
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              if (localElement.useAddressPrefix !== false) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      'personalAddress2': (() => {
        if (userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.type === 'personal_2');
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              if (localElement.useAddressPrefix !== false) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      'workAddress1': (() => {
        if (userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.type === 'work_1');
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              if (localElement.useAddressPrefix !== false) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      'workAddress2': (() => {
        if (userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.type === 'work_2');
          if (address) {
            // สร้างที่อยู่ตามรูปแบบ: ที่อยู่ ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์
            const addressParts = [];
            
            // เพิ่มที่อยู่
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            
            // เพิ่มตำบล/แขวง
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            
            // เพิ่มอำเภอ/เขต
            if (address.district) {
              if (localElement.useAddressPrefix !== false) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            
            // เพิ่มจังหวัด
            if (address.province) {
              if (localElement.useAddressPrefix !== false) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
            
            // เพิ่มรหัสไปรษณีย์
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      'personalId': userData.personalId || userData.user_metadata?.personal_id || '',
      // Social Media Fields
      'facebook': userData.facebook || userData.user_metadata?.facebook || '',
      'line': userData.lineId || userData.user_metadata?.line_id || '',
      'instagram': userData.instagram || userData.user_metadata?.instagram || '',
      'twitter': userData.twitter || userData.user_metadata?.twitter || '',
      'linkedin': userData.linkedin || userData.user_metadata?.linkedin || '',
      'youtube': userData.youtube || userData.user_metadata?.youtube || '',
      'tiktok': userData.tiktok || userData.user_metadata?.tiktok || '',
      'telegram': userData.telegram || userData.user_metadata?.telegram || '',
      'whatsapp': userData.whatsapp || userData.user_metadata?.whatsapp || '',
      'wechat': userData.wechat || userData.user_metadata?.wechat || '',
      'snapchat': userData.snapchat || userData.user_metadata?.snapchat || '',
      'pinterest': userData.pinterest || userData.user_metadata?.pinterest || '',
      'reddit': userData.reddit || userData.user_metadata?.reddit || '',
      'discord': userData.discord || userData.user_metadata?.discord || '',
      'slack': userData.slack || userData.user_metadata?.slack || '',
      'viber': userData.viber || userData.user_metadata?.viber || '',
      'skype': userData.skype || userData.user_metadata?.skype || '',
      'zoom': userData.zoom || userData.user_metadata?.zoom || '',
      'github': userData.github || userData.user_metadata?.github || '',
      'twitch': userData.twitch || userData.user_metadata?.twitch || '',
    };

    const result = fieldMap[field] || '';
    console.log('🔍 getFieldData result:', { field, result });
    return result;
  };

    return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col property-panel">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">Properties</h3>
        <div className="flex space-x-2">
            <button
            onClick={() => onElementDelete?.(element.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>

      {/* Property Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActivePropertyTab('content')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activePropertyTab === 'content'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActivePropertyTab('style')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activePropertyTab === 'style'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Style
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activePropertyTab === 'content' && (
          <>
          {/* Element Type */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Element Type</h4>
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <span className="text-sm text-gray-900 capitalize">
                    {localElement.type === 'qrcode' ? 'QR Code' : 
                     localElement.type === 'textarea' ? 'Text Area' :
                     localElement.type === 'social' ? 'Social Media' :
                     localElement.type}
                  </span>
                </div>
              </div>
          </div>

        {/* Content for Text, Textarea, Social */}
        {(localElement.type === 'text' || localElement.type === 'textarea' || localElement.type === 'social') && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Content</h4>
            
            {/* Bind to Field */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bind to Field</label>
              <select
                value={localElement.field || ''}
                onChange={(e) => handleFieldChange(e.target.value)}
                className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              >
                {/* Custom Content - Only for text and textarea elements */}
                {(localElement.type === 'text' || localElement.type === 'textarea') && (
                  <option value="">Custom Content</option>
                )}
                
                {/* Text Element - No Address Fields */}
                {localElement.type === 'text' && (
                    <>
                      <option value="name">ชื่อ-นามสกุล</option>
                      <option value="nameEn">ชื่อ-นามสกุล (ภาษาอังกฤษ)</option>
                    <option value="personalId">เลขประจำตัวประชาชน</option>
                      <option value="personalPhone">เบอร์โทรศัพท์ส่วนตัว</option>
                      <option value="personalEmail">อีเมลส่วนตัว</option>
                      <option value="workName">ชื่อบริษัท</option>
                    <option value="workDepartment">แผนก/ส่วนงาน</option>
                      <option value="workPosition">ตำแหน่งงาน</option>
                      <option value="workPhone">เบอร์โทรศัพท์ที่ทำงาน</option>
                      <option value="workEmail">อีเมลที่ทำงาน</option>
                      <option value="workWebsite">เว็บไซต์</option>
                    <option value="taxIdMain">เลขประจำตัวผู้เสียภาษี (สำนักงานใหญ่)</option>
                    <option value="taxIdBranch">เลขประจำตัวผู้เสียภาษี (สาขาย่อย)</option>
                  </>
                )}
                
                {/* Social Media Element - Only Social Media Fields */}
                {localElement.type === 'social' && (
                  <>
                    <option value="facebook">Facebook</option>
                    <option value="line">Line</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="wechat">WeChat</option>
                    <option value="snapchat">Snapchat</option>
                    <option value="pinterest">Pinterest</option>
                    <option value="reddit">Reddit</option>
                    <option value="discord">Discord</option>
                    <option value="slack">Slack</option>
                    <option value="viber">Viber</option>
                    <option value="skype">Skype</option>
                    <option value="zoom">Zoom</option>
                    <option value="github">GitHub</option>
                    <option value="twitch">Twitch</option>
                  </>
                )}
                
                {/* Textarea Element - Only Address Fields */}
                {localElement.type === 'textarea' && (
                  <>
                    <option value="personalAddress1">ที่อยู่ส่วนตัว (1)</option>
                    <option value="personalAddress2">ที่อยู่ส่วนตัว (2)</option>
                    <option value="workAddress1">ที่อยู่ที่ทำงาน (1)</option>
                    <option value="workAddress2">ที่อยู่ที่ทำงาน (2)</option>
                  </>
                )}
              </select>
                      </div>

                      {/* Address Prefix Checkbox - Only for Textarea with Address Fields */}
                      {localElement.type === 'textarea' && localElement.field && (
                      <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Address Format</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={localElement.useAddressPrefix !== false}
                              onChange={(e) => {
                                const updatedElement = { ...localElement, useAddressPrefix: e.target.checked };
                                setLocalElement(updatedElement);
                                onElementChange(updatedElement);
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">Use prefix (แขวง/เขต, ตำบล/อำเภอ, จังหวัด)</span>
                      </div>
                        </div>
                      )}

                      {/* Field Data Display */}
            {localElement.field && (
                      <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                          Field Data
                        </label>
                          {localElement.type === 'textarea' ? (
                        <textarea
                              value={getFieldData(localElement.field) || 'No data available'}
                          readOnly
                              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-xs resize-none"
                        rows={3}
                      />
                          ) : (
                          <div className="w-full px-3 h-10 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-xs flex items-center">
                            {getFieldData(localElement.field) || 'No data available'}
                          </div>
                          )}
                        </div>
                      )}
                      
            {/* Custom Content */}
            {!localElement.field && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                        {localElement.type === 'textarea' ? (
                      <textarea
                        value={localElement.content || ''}
                        onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                        placeholder={localElement.field && localElement.field !== '' ? 'custom content' : 'Enter content'}
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        value={localElement.content || ''}
                        onChange={(e) => handleContentChange(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        placeholder={localElement.field && localElement.field !== '' ? 'custom content' : 'Enter content'}
                      />
                  )}
            </div>
          )}
            </div>
          )}

        {/* QR Code Properties */}
          {localElement.type === 'qrcode' && (
            <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">QR Code</h4>
            
            {/* QR Code Link */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">QR Code Link</label>
              <input
                type="text"
                value={localElement.qrUrl || ''}
                onChange={(e) => {
                  const updatedElement = { ...localElement, qrUrl: e.target.value };
                  setLocalElement(updatedElement);
                  onElementChange(updatedElement);
                }}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                placeholder="Enter QR code link"
              />
            </div>

              {/* QR Code Style */}
              <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">QR Code Style</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'standard', label: 'Standard' },
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'dots', label: 'Dots' },
                  { value: 'classy', label: 'Classy' },
                  { value: 'classy-rounded', label: 'Classy Rounded' },
                  { value: 'extra-rounded', label: 'Extra Rounded' },
                  { value: 'custom-corners', label: 'Custom Corners' },
                  { value: 'gradient-style', label: 'Gradient' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      const updatedElement = { ...localElement, qrStyle: style.value as any };
                      setLocalElement(updatedElement);
                    onElementChange(updatedElement);
                  }}
                    className={`p-2 text-xs border rounded-md flex flex-col items-center space-y-1 ${
                      localElement.qrStyle === style.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <QRCodePreview 
                        qrStyle={style.value}
                        qrColor={localElement.qrColor || '#000000'}
                        qrUrl={localElement.qrUrl || "https://example.com"}
                      />
                    </div>
                    <span className="text-center text-[10px] leading-tight">{style.label}</span>
                  </button>
                ))}
              </div>
              </div>


            {/* QR Code Logo Upload */}
              <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">QR Code Logo</label>
                <input
                ref={qrLogoUploadRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const logoUrl = event.target?.result as string;
                      const updatedElement = { ...localElement, qrLogo: logoUrl };
                      setLocalElement(updatedElement);
                      onElementChange(updatedElement);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                  className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

            {/* QR Code Logo URL */}
              <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
              <div className="flex space-x-2">
                <input
                type="text"
                value={localElement.qrLogo || ''}
                onChange={(e) => {
                  const updatedElement = { ...localElement, qrLogo: e.target.value };
                  setLocalElement(updatedElement);
                  onElementChange(updatedElement);
                }}
                  className="flex-1 h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                placeholder="Enter logo URL"
                />
                {localElement.qrLogo && (
                  <button
                    onClick={() => {
                      const updatedElement = { ...localElement, qrLogo: '' };
                      setLocalElement(updatedElement);
                      onElementChange(updatedElement);
                      // Reset file input
                      if (qrLogoUploadRef.current) {
                        qrLogoUploadRef.current.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                    title="ลบโลโก้"
                  >
                    ลบ
                  </button>
                )}
                </div>
                </div>
              </div>
          )}

        {/* Picture Properties */}
          {localElement.type === 'picture' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Picture</h4>
            
            {/* Image Upload */}
              <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Upload Image</label>
                    <input
                      ref={imageUploadRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const imageUrl = event.target?.result as string;
                      const updatedElement = { ...localElement, imageUrl };
                            setLocalElement(updatedElement);
                            onElementChange(updatedElement);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full h-10 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

            {/* Image URL */}
              <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
              <div className="flex space-x-2">
                    <input
                type="text"
                value={localElement.imageUrl || ''}
                      onChange={(e) => {
                  const updatedElement = { ...localElement, imageUrl: e.target.value };
                            setLocalElement(updatedElement);
                            onElementChange(updatedElement);
                      }}
                      className="flex-1 h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                placeholder="Enter image URL"
                    />
                    {localElement.imageUrl && (
                      <button
                        onClick={() => {
                          const updatedElement = { ...localElement, imageUrl: '' };
                          setLocalElement(updatedElement);
                          onElementChange(updatedElement);
                          // Reset file input
                          if (imageUploadRef.current) {
                            imageUploadRef.current.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                        title="ลบรูปภาพ"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                  </div>
                
                {/* Image Preview */}
                {(localElement.imageUrl || getFieldData(localElement.field || '')) && (
                  <div className="mt-2">
                    <img 
                      src={
                        // ถ้ามี field binding ให้ใช้ข้อมูลจาก field ก่อน
                        (localElement.field && getFieldData(localElement.field)) 
                          ? getFieldData(localElement.field)
                          : localElement.imageUrl
                      } 
                      alt="Preview" 
                  className="w-full h-32 object-cover rounded-md border border-gray-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                    />
                  </div>
                )}
              </div>
          )}

        {/* Icon Properties */}
          {localElement.type === 'icon' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Icon</h4>
            
            {/* Icon Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Icon Type</label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { value: 'phone', icon: FaPhone },
                  { value: 'email', icon: FaEnvelope },
                  { value: 'website', icon: FaGlobe },
                  { value: 'location', icon: FaHome },
                  { value: 'facebook', icon: FaFacebook },
                  { value: 'instagram', icon: FaInstagram },
                  { value: 'twitter', icon: FaTwitter },
                  { value: 'linkedin', icon: FaLinkedin },
                  { value: 'youtube', icon: FaYoutube },
                  { value: 'line', icon: MessageCircle },
                  { value: 'whatsapp', icon: FaWhatsapp },
                  { value: 'telegram', icon: FaTelegram },
                  { value: 'github', icon: FaGithub },
                  { value: 'skype', icon: FaSkype },
                  { value: 'zoom', icon: Video },
                  { value: 'tiktok', icon: FaTiktok },
                  { value: 'discord', icon: FaDiscord },
                  { value: 'slack', icon: FaSlack },
                  { value: 'wechat', icon: MessageCircle },
                  { value: 'viber', icon: FaViber },
                  { value: 'snapchat', icon: FaSnapchat },
                  { value: 'pinterest', icon: FaPinterest },
                  { value: 'reddit', icon: FaReddit },
                  { value: 'twitch', icon: FaTwitch }
                ].map((icon) => (
                  <button
                    key={icon.value}
                    onClick={() => handleIconNameChange(icon.value)}
                    className={`p-2 text-xs border rounded-md flex items-center justify-center ${
                      localElement.iconName === icon.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title={icon.value}
                  >
                    <icon.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>


            </div>
          )}

            {/* Size & Position */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Size & Position</h4>
              {/* Size */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                  <input
                  type="number"
                    value={localElement.width}
                    onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Width"
                  />
                </div>
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                    <input
                      type="number"
                    value={localElement.height}
                    onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Height"
                    />
                </div>
              </div>

              {/* Position */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
                        <input
                  type="number"
                    value={localElement.x}
                    onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="X Position"
                />
                    </div>
                  <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y Position</label>
                    <input
                  type="number"
                    value={localElement.y}
                    onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Y Position"
                />
                </div>
              </div>
            </div>

            </>
          )}

        {activePropertyTab === 'style' && (
          <>
            {/* Style Properties */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Style</h4>
          
            {/* Icon Color - Only for Icon Elements */}
            {localElement.type === 'icon' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Icon Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={localElement.style?.color || '#000000'}
                    onChange={(e) => {
                      const newElement = {
                        ...localElement,
                        style: {
                          ...localElement.style,
                          color: e.target.value
                        }
                      };
                      setLocalElement(newElement);
                      onElementChange(newElement);
                    }}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    title="Choose icon color"
                  />
                  <input
                    type="text"
                    value={localElement.style?.color || '#000000'}
                    onChange={(e) => {
                      const newElement = {
                        ...localElement,
                        style: {
                          ...localElement.style,
                          color: e.target.value
                        }
                      };
                      setLocalElement(newElement);
                      onElementChange(newElement);
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}
          
            {/* Font Settings - Only for Text Elements */}
            {(localElement.type === 'text' || localElement.type === 'textarea' || localElement.type === 'social') && (
              <>
                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <input
                    type="number"
                  value={localElement.style?.fontSize || 16}
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value) || 16)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="Font Size"
                  min="8"
                    max="72"
                  />
                </div>

            {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                  <select
                    value={localElement.style?.fontFamily || 'Arial'}
                  onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                    className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Palatino">Palatino</option>
                </select>
              </div>

                {/* Font Formatting Icons */}
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Formatting</label>
                <div className="flex space-x-2">
                    {/* Bold */}
                    <button
                      onClick={() => {
                        const currentWeight = localElement.style?.fontWeight || 'normal';
                        const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
                        handleStyleChange('fontWeight', newWeight);
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-md border-2 transition-colors ${
                        localElement.style?.fontWeight === 'bold'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Bold"
                    >
                      <span className="font-bold text-sm">B</span>
                    </button>

                    {/* Italic */}
                  <button
                      onClick={() => {
                        const currentStyle = localElement.style?.fontStyle || 'normal';
                        const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
                        handleStyleChange('fontStyle', newStyle);
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-md border-2 transition-colors ${
                        localElement.style?.fontStyle === 'italic'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Italic"
                    >
                      <span className="italic text-sm">I</span>
                  </button>

                    {/* Underline */}
                  <button
                      onClick={() => {
                        const currentDecoration = localElement.style?.textDecoration || 'none';
                        const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
                        handleStyleChange('textDecoration', newDecoration);
                      }}
                      className={`flex items-center justify-center w-8 h-8 rounded-md border-2 transition-colors ${
                        localElement.style?.textDecoration === 'underline'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Underline"
                    >
                      <span className="underline text-sm">U</span>
                  </button>
                </div>
              </div>
              </>
            )}

            {/* Text Color - Only for Text Elements */}
            {(localElement.type === 'text' || localElement.type === 'textarea' || localElement.type === 'social') && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={localElement.style?.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localElement.style?.color || '#000000'}
                    onChange={(e) => handleStyleChange('color', e.target.value)}
                    className="flex-1 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>
            )}

            {/* QR Code Color - Only for QR Code Element */}
            {localElement.type === 'qrcode' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">QR Code Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={localElement.qrColor || '#000000'}
                    onChange={(e) => {
                      const updatedElement = { ...localElement, qrColor: e.target.value };
                      setLocalElement(updatedElement);
                      onElementChange(updatedElement);
                    }}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localElement.qrColor || '#000000'}
                    onChange={(e) => {
                      const updatedElement = { ...localElement, qrColor: e.target.value };
                      setLocalElement(updatedElement);
                      onElementChange(updatedElement);
                    }}
                    className="flex-1 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="#000000"
                  />
                </div>
                </div>
            )}

              {/* Background Color */}
              <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                    <input
                      type="color"
                    value={localElement.style?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                    value={localElement.style?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="flex-1 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    placeholder="#ffffff"
                  />
                  </div>
                  </div>

          {/* Border Settings */}
          <div className="space-y-3">
              <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Border</label>
                          <div className="flex items-center space-x-2">
                    <input
                          type="checkbox"
                    checked={!!localElement.style?.border?.width}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleStyleChange('border', { 
                        width: 1, 
                        color: '#000000',
                        radius: 0
                      });
                    } else {
                      handleStyleChange('border', undefined);
                    }
                  }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                <span className="text-xs text-gray-600">Enable Border</span>
                    </div>
            </div>

                {localElement.style?.border && localElement.style.border.width > 0 && (
                  <>
              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                <input
                  type="number"
                        value={localElement.style?.border?.width || 1}
                    onChange={(e) => handleStyleChange('border', { ...localElement.style?.border, width: parseInt(e.target.value) || 1 })}
                        className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        placeholder="Border width"
                        min="1"
                        max="10"
                />
              </div>

              <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                      <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={localElement.style?.border?.color || '#000000'}
                      onChange={(e) => handleStyleChange('border', { ...localElement.style?.border, color: e.target.value })}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localElement.style?.border?.color || '#000000'}
                      onChange={(e) => handleStyleChange('border', { ...localElement.style?.border, color: e.target.value })}
                      className="flex-1 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                          placeholder="#000000"
                    />
                      </div>
                  </div>

                  <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                    <input
                      type="number"
                      value={localElement.style?.border?.radius || 0}
                    onChange={(e) => handleStyleChange('border', { ...localElement.style?.border, radius: parseInt(e.target.value) || 0 })}
                        className="w-full h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="Border radius"
                      min="0"
                      max="50"
                    />
                  </div>
                  </>
                )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
};

export default PropertyPanel;