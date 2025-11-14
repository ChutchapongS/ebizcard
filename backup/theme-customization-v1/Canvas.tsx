'use client';

import { useDroppable } from '@dnd-kit/core';
import { useState, useRef, useEffect } from 'react';
import { CanvasElement, PaperSettings, MockData } from '@/types/theme-customization';
import { DraggableElement } from './DraggableElement';
import { Facebook, MessageCircle, Linkedin, Twitter, Instagram, Video, Send, Smartphone, Camera, Pin, Users, Hash, PhoneCall, Mic, Code, Gamepad2 } from 'lucide-react';
import { FaTiktok, FaYoutube, FaTelegram, FaWhatsapp, FaSnapchat, FaPinterest, FaReddit, FaDiscord, FaSlack, FaViber, FaSkype, FaGithub, FaTwitch } from 'react-icons/fa';
import QRCodeStyling from 'qr-code-styling';
import { 
  FaPalette, FaStar, FaHeart, FaThumbsUp, FaFire, FaLightbulb,
  FaRocket, FaGem, FaBullseye, FaDumbbell, FaGift,
  FaTrophy, FaHome, FaBuilding, FaStore, FaHospital, FaSchool,
  FaIndustry, FaMobile, FaLaptop, FaCamera, FaMusic, FaFilm,
  FaBook, FaGamepad, FaUser, FaEnvelope, FaPhone, FaGlobe,
  FaFacebook, FaLinkedin, FaTwitter, FaInstagram
} from 'react-icons/fa';

interface CanvasProps {
  paperSettings: PaperSettings;
  elements: CanvasElement[];
  mockData: MockData;
  userData?: any; // Add userData prop
  onElementSelect: (element: CanvasElement | null) => void;
  selectedElement: CanvasElement | null;
  isDragging: boolean;
  onElementDelete?: (elementId: string) => void;
  onElementUpdate?: (element: CanvasElement) => void;
  onSaveTemplate?: () => void; // Add onSaveTemplate prop
  useAddressPrefix?: boolean; // Add useAddressPrefix prop
}

export function Canvas({
  paperSettings,
  elements,
  mockData,
  userData,
  onElementSelect,
  selectedElement,
  isDragging,
  onElementDelete,
  onElementUpdate,
  useAddressPrefix = true
}: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [fitPercentage, setFitPercentage] = useState<number | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(100);
  const [originalZoom, setOriginalZoom] = useState<number>(100);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [previewOriginalZoom, setPreviewOriginalZoom] = useState<number>(100);

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

  // QR Code Canvas Component
  const QRCodeCanvas = ({ element, content }: { element: CanvasElement; content: string }) => {
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (qrRef.current) {
        qrRef.current.innerHTML = ''; // Clear previous content
        
        const stylingOptions = getQRCodeStyling(element.qrStyle || 'standard', element.qrColor);
        
        // Create QR Code options
        const qrOptions: any = {
          ...stylingOptions,
          width: Math.min(element.width - 8, element.height - 8),
          height: Math.min(element.width - 8, element.height - 8),
          data: content,
          backgroundOptions: {
            ...stylingOptions.backgroundOptions,
            color: element.style?.backgroundColor || stylingOptions.backgroundOptions.color
          }
        };

        // Add imageOptions only if qrLogo exists
        if (element.qrLogo) {
          qrOptions.imageOptions = {
            hideBackgroundDots: true,
            imageSize: 0.4,
            margin: 0,
            crossOrigin: 'anonymous'
          };
        }

        const qrCode = new QRCodeStyling(qrOptions);
        qrCode.append(qrRef.current);
      }
    }, [element, content]);

    return <div ref={qrRef} className="w-full h-full flex items-center justify-center" />;
  };

  const getFieldValue = (field: string): string => {
    if (!userData || !field) {
        return '';
    }
    
    // Map field names to userData properties (updated to match page.tsx structure)
    const fieldMap: { [key: string]: string } = {
      'name': userData.name || userData.user_metadata?.full_name || '',
          'nameEn': userData.nameEn || userData.user_metadata?.full_name_english || '',
      'personalPhone': userData.personalPhone || userData.user_metadata?.personal_phone || '',
      'personalEmail': userData.personalEmail || userData.user_metadata?.personal_email || userData.email || '',
      'workName': userData.workName || userData.user_metadata?.company || '',
      'workDepartment': userData.workDepartment || userData.user_metadata?.department || '',
      'workPosition': userData.workPosition || userData.user_metadata?.job_title || '',
      'workPhone': userData.workPhone || userData.user_metadata?.work_phone || '',
      'workEmail': userData.workEmail || userData.user_metadata?.work_email || '',
      'workWebsite': userData.workWebsite || userData.user_metadata?.website || '',
      'taxIdMain': userData.taxIdMain || userData.user_metadata?.tax_id_main || '',
      'taxIdBranch': userData.taxIdBranch || userData.user_metadata?.tax_id_branch || '',
      'personalId': userData.personalId || userData.user_metadata?.personal_id || '',
      // New address fields
      'personalAddress1': (() => {
        if (userData.addresses) {
          const address = userData.addresses.find((addr: any) => addr.type === 'personal_1');
          if (address) {
            const addressParts = [];
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            if (address.district) {
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            if (address.province) {
              if (useAddressPrefix) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
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
            const addressParts = [];
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            if (address.district) {
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            if (address.province) {
              if (useAddressPrefix) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
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
            const addressParts = [];
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            if (address.district) {
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            if (address.province) {
              if (useAddressPrefix) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
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
            const addressParts = [];
            if (address.address || address.street) {
              addressParts.push(address.address || address.street);
            }
            if (address.tambon || address.subdistrict) {
              const tambon = address.tambon || address.subdistrict;
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`แขวง${tambon}`);
                } else {
                  addressParts.push(`ตำบล${tambon}`);
                }
              } else {
                addressParts.push(tambon);
              }
            }
            if (address.district) {
              if (useAddressPrefix) {
                if (address.province === 'กรุงเทพมหานคร') {
                  addressParts.push(`เขต${address.district}`);
                } else {
                  addressParts.push(`อำเภอ${address.district}`);
                }
              } else {
                addressParts.push(address.district);
              }
            }
            if (address.province) {
              if (useAddressPrefix) {
                addressParts.push(`จังหวัด${address.province}`);
              } else {
                addressParts.push(address.province);
              }
            }
            if (address.postal_code || address.postalCode) {
              addressParts.push(address.postal_code || address.postalCode);
            }
            return addressParts.join(' ');
          }
        }
        return '';
      })(),
      // Old address fields (for backward compatibility)
      'address': userData.address || userData.user_metadata?.addresses?.[0]?.address || '',
      // Social Media Fields
      'facebook': userData.facebook || userData.user_metadata?.facebook || '',
      'line': userData.lineId || userData.user_metadata?.line_id || '',
      'linkedin': userData.linkedin || userData.user_metadata?.linkedin || '',
      'twitter': userData.twitter || userData.user_metadata?.twitter || '',
      'instagram': userData.instagram || userData.user_metadata?.instagram || '',
      'tiktok': userData.tiktok || userData.user_metadata?.tiktok || '',
      'youtube': userData.youtube || userData.user_metadata?.youtube || '',
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
      'twitch': userData.twitch || userData.user_metadata?.twitch || ''
    };
    
    const result = fieldMap[field] || '';
    return result;
  };

  const getElementContent = (element: CanvasElement): string => {
    if (element.type === 'qrcode') {
      return element.content || '';
    }
    // If element has field binding, use field value (ignore content)
    if (element.field) return getFieldValue(element.field);
    // If no field binding, use content
    if (element.content) return element.content;
    return '';
  };

  // Function to get icon component by name
  const getIconComponent = (iconName: string) => {
    // Map PropertyPanel icon values to FontAwesome components
    const iconMap: { [key: string]: any } = {
      // Original FontAwesome icons
      'FaPalette': FaPalette,
      'FaStar': FaStar,
      'FaHeart': FaHeart,
      'FaThumbsUp': FaThumbsUp,
      'FaFire': FaFire,
      'FaLightbulb': FaLightbulb,
      'FaRocket': FaRocket,
      'FaGem': FaGem,
      'FaBullseye': FaBullseye,
      'FaDumbbell': FaDumbbell,
      'FaGift': FaGift,
      'FaTrophy': FaTrophy,
      'FaHome': FaHome,
      'FaBuilding': FaBuilding,
      'FaStore': FaStore,
      'FaHospital': FaHospital,
      'FaSchool': FaSchool,
      'FaIndustry': FaIndustry,
      'FaMobile': FaMobile,
      'FaLaptop': FaLaptop,
      'FaCamera': FaCamera,
      'FaMusic': FaMusic,
      'FaFilm': FaFilm,
      'FaBook': FaBook,
      'FaGamepad': FaGamepad,
      'FaUser': FaUser,
      'FaEnvelope': FaEnvelope,
      'FaPhone': FaPhone,
      'FaGlobe': FaGlobe,
      'FaFacebook': FaFacebook,
      'FaLinkedin': FaLinkedin,
      'FaTwitter': FaTwitter,
      'FaInstagram': FaInstagram,
      'FaTiktok': FaTiktok,
      
      // PropertyPanel icon values mapped to FontAwesome components
      'phone': FaPhone,
      'email': FaEnvelope,
      'website': FaGlobe,
      'location': FaHome,
      'facebook': FaFacebook,
      'instagram': FaInstagram,
      'twitter': FaTwitter,
      'linkedin': FaLinkedin,
      'youtube': FaYoutube,
      'line': MessageCircle,
      'whatsapp': FaWhatsapp,
      'telegram': FaTelegram,
      'github': FaGithub,
      'skype': FaSkype,
      'zoom': Video,
      'tiktok': FaTiktok,
      'discord': FaDiscord,
      'slack': FaSlack,
      'wechat': MessageCircle,
      'viber': FaViber,
      'snapchat': FaSnapchat,
      'pinterest': FaPinterest,
      'reddit': FaReddit,
      'twitch': FaTwitch
    };
    
    return iconMap[iconName] || FaStar; // Default to FaStar if icon not found
  };

  // Convert mm to px (1mm = 3.7795275591px at 96 DPI)
  const mmToPx = (mm: number) => mm * 3.7795275591;
  
  
  const getBackgroundStyle = () => {
    if (paperSettings.background.type === 'image' && paperSettings.background.image) {
      const imageFit = paperSettings.background.imageFit || 'cover';
      const imagePosition = paperSettings.background.imagePosition || 'center';
      const imageRepeat = paperSettings.background.imageRepeat || 'no-repeat';
      
      return {
        backgroundImage: `url(${paperSettings.background.image})`,
        backgroundSize: imageFit,
        backgroundPosition: imagePosition,
        backgroundRepeat: imageRepeat
      };
    }
    
    if (paperSettings.background.type === 'color') {
      if (paperSettings.background.gradient?.type === 'gradient') {
        const direction = paperSettings.background.gradient.direction === 'horizontal' 
          ? 'to right' 
          : paperSettings.background.gradient.direction === 'vertical'
          ? 'to bottom'
          : '45deg';
        
        return {
          background: `linear-gradient(${direction}, ${paperSettings.background.gradient.colors.join(', ')})`
        };
      } else {
        return {
          backgroundColor: paperSettings.background.color
        };
      }
    }
    
    return {
      backgroundColor: 'transparent'
    };
  };

  const canvasStyle = {
    width: mmToPx(paperSettings.width),
    height: mmToPx(paperSettings.height),
    ...getBackgroundStyle()
  };


  return (
    <div className="flex flex-col items-center pt-4">
      {/* Zoom Control - Responsive */}
      <div className="w-full mb-2">
        <div className="flex flex-wrap items-center justify-start gap-2 sm:gap-3">
          <label className="text-xs sm:text-sm text-gray-600">Zoom:</label>
              <select 
                className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={currentZoom}
                onChange={(e) => {
                  const zoom = parseInt(e.target.value);
                  const canvas = document.getElementById('canvas');
                  if (canvas) {
                    canvas.style.transform = `scale(${zoom / 100})`;
                    canvas.style.transformOrigin = 'top left';
                    setCurrentZoom(zoom);
                    setOriginalZoom(zoom); // เก็บค่า zoom เดิม
                    // Reset fit percentage when manually changing zoom
                    setFitPercentage(null);
                  }
                }}
          >
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
          <button
            onClick={() => {
              const canvas = document.getElementById('canvas');
              const canvasContainer = document.getElementById('canvas-container');
              if (canvas && canvasContainer) {
                const canvasWidth = mmToPx(paperSettings.width);
                const canvasHeight = mmToPx(paperSettings.height);
                
                // Get canvas container dimensions (fixed size: 800x500px with available space 768x468px)
                const containerWidth = 768; // 768px available width (800px - 32px padding)
                const containerHeight = 468; // 468px available height (500px - 32px padding)
                
                // Ensure we have valid dimensions
                if (containerWidth <= 0 || containerHeight <= 0) {
                  console.warn('Invalid container dimensions');
                  return;
                }
                
                // Calculate scale to fit both width and height
                const scaleX = containerWidth / canvasWidth;
                const scaleY = containerHeight / canvasHeight;
                const scale = Math.min(scaleX, scaleY); // Allow scaling down to fit
                
                // Ensure scale is not too small (minimum 5%)
                const finalScale = Math.max(scale, 0.05);
                
                
                canvas.style.transform = `scale(${finalScale})`;
                canvas.style.transformOrigin = 'top left';
                
                // Update fit percentage display
                const percentage = Math.round(finalScale * 100);
                setFitPercentage(percentage);
                // Don't change currentZoom - keep original zoom value
              }
            }}
            className="px-2 sm:px-3 py-1 bg-gray-600 text-white rounded text-xs sm:text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            title="Fit to Paper"
          >
            📄
          </button>
          {fitPercentage && (
            <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              Fit: {fitPercentage}%
            </span>
          )}
          <button
            onClick={() => {
              const canvas = document.getElementById('canvas');
              if (canvas) {
                canvas.style.transform = `scale(${originalZoom / 100})`;
                canvas.style.transformOrigin = 'top left';
                setCurrentZoom(originalZoom);
                setFitPercentage(null);
              }
            }}
            className="px-2 sm:px-3 py-1 bg-orange-600 text-white rounded text-xs sm:text-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            title="Reset to Original Zoom"
          >
            ↺
          </button>
          <button
            onClick={() => {
              const modal = document.getElementById('preview-modal');
              if (modal) {
                modal.classList.remove('hidden');
              }
            }}
            className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="hidden sm:inline">Preview</span>
            <span className="sm:hidden">👁</span>
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 ${
              showGrid 
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
            }`}
            title={showGrid ? 'Hide Grid' : 'Show Grid'}
          >
            {showGrid ? '⊞' : '⊟'}
          </button>
        </div>
      </div>
      
      {/* Canvas Container with Scroll */}
      <div id="canvas-container" className="bg-white rounded-lg shadow-lg p-2 sm:p-4 w-full max-w-[800px] h-[600px] sm:h-[800px] lg:h-[1000px] overflow-auto border border-gray-200">
        <div
          id="canvas"
          ref={(node) => {
            setNodeRef(node);
            canvasRef.current = node;
          }}
          onClick={(e) => {
            // Only deselect if clicking on canvas background (not on elements)
            if (e.target === e.currentTarget) {
              onElementSelect(null);
            }
          }}
          className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
          style={{
            ...canvasStyle,
            borderColor: isOver ? '#3b82f6' : isDragging ? '#6b7280' : '#d1d5db',
            borderStyle: isOver ? 'solid' : 'dashed'
          }}
        >
          {/* Grid Overlay */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                opacity: 0.5
              }}
            />
          )}

          {/* Drop zone indicator */}
          {isOver && (
            <div className="absolute inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center">
              <div className="text-blue-600 font-medium">
                Drop element here
              </div>
            </div>
          )}

          {/* Canvas elements */}
          {elements.map((element) => {
            return (
              <DraggableElement
                key={element.id}
                element={element}
                content={getElementContent(element)}
                isSelected={selectedElement?.id === element.id}
                onSelect={() => onElementSelect(element)}
                onDelete={onElementDelete}
                onUpdate={onElementUpdate}
                canvasRef={canvasRef}
                userData={userData}
              />
            );
          })}

          {/* Empty state */}
          {elements.length === 0 && !isDragging && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              <div className="text-center transform -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">Drag elements from the right panel to start building your template</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Preview Modal */}
      <div id="preview-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-[1000px] h-[500px] sm:h-[600px] lg:h-[700px] overflow-auto mx-4">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Template Preview</h3>
            <button
              onClick={() => {
                const modal = document.getElementById('preview-modal');
                if (modal) {
                  modal.classList.add('hidden');
                }
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Preview Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Zoom:</label>
              <select 
                id="preview-zoom-select"
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={previewZoom}
                onChange={(e) => {
                  const zoom = parseInt(e.target.value);
                  const previewCanvas = document.getElementById('preview-canvas');
                  if (previewCanvas) {
                    previewCanvas.style.transform = `scale(${zoom / 100})`;
                    previewCanvas.style.transformOrigin = 'top left';
                    setPreviewZoom(zoom);
                    setPreviewOriginalZoom(zoom); // เก็บค่า zoom เดิม
                    // Reset fit percentage when manually changing zoom
                    const fitSpan = document.getElementById('preview-fit-percentage');
                    if (fitSpan) {
                      fitSpan.style.display = 'none';
                    }
                  }
                }}
              >
                <option value="25">25%</option>
                <option value="50">50%</option>
                <option value="75">75%</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
                <option value="200">200%</option>
              </select>
              <button
                onClick={() => {
                  const previewCanvas = document.getElementById('preview-canvas');
                  if (previewCanvas) {
                    const canvasWidth = mmToPx(paperSettings.width);
                    const canvasHeight = mmToPx(paperSettings.height);
                    
                    // Get preview modal container dimensions (1000x700px with available space 800x500px)
                    const containerWidth = 800; // 800px available width (1000px - 200px padding)
                    const containerHeight = 500; // 500px available height (700px - 200px for header and controls)
                    
                    // Ensure we have valid dimensions
                    if (containerWidth <= 0 || containerHeight <= 0) {
                      console.warn('Invalid container dimensions');
                      return;
                    }
                    
                    // Calculate scale to fit both width and height
                    const scaleX = containerWidth / canvasWidth;
                    const scaleY = containerHeight / canvasHeight;
                    const scale = Math.min(scaleX, scaleY); // Allow scaling down to fit
                    
                    // Ensure scale is not too small (minimum 5%)
                    const finalScale = Math.max(scale, 0.05);
                    
                    
                    previewCanvas.style.transform = `scale(${finalScale})`;
                    previewCanvas.style.transformOrigin = 'top left';
                    
                    // Update fit percentage display
                    const percentage = Math.round(finalScale * 100);
                    const fitSpan = document.getElementById('preview-fit-percentage');
                    if (fitSpan) {
                      fitSpan.textContent = `Fit: ${percentage}%`;
                      fitSpan.style.display = 'inline';
                    }
                    // Don't change previewZoom - keep original zoom value
                  }
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                title="Fit to Paper"
              >
                📄
              </button>
              <span id="preview-fit-percentage" className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded" style={{display: 'none'}}>
                Fit: 0%
              </span>
              <button
                onClick={() => {
                  const previewCanvas = document.getElementById('preview-canvas');
                  if (previewCanvas) {
                    previewCanvas.style.transform = `scale(${previewOriginalZoom / 100})`;
                    previewCanvas.style.transformOrigin = 'top left';
                    setPreviewZoom(previewOriginalZoom);
                    // Hide fit percentage
                    const fitSpan = document.getElementById('preview-fit-percentage');
                    if (fitSpan) {
                      fitSpan.style.display = 'none';
                    }
                  }
                }}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                title="Reset to Original Zoom"
              >
                ↺
              </button>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-3 sm:p-4 h-full">
            <div className="flex justify-center">
              <div 
                id="preview-canvas"
                className="bg-white border-2 border-gray-300 rounded-lg shadow-lg relative"
                style={{
                  width: `${mmToPx(paperSettings.width)}px`,
                  height: `${mmToPx(paperSettings.height)}px`,
                  ...getBackgroundStyle()
                }}
              >
                {/* Render elements in preview */}
                {elements.map((element) => (
                  <div
                    key={element.id}
                    style={{
                      position: 'absolute',
                      left: element.x,
                      top: element.y,
                      width: element.width || 100,
                      height: element.height || 50,
                      ...element.style,
                      display: 'flex',
                      alignItems: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      padding: element.style.padding ? `${element.style.padding}px` : '4px',
                      backgroundColor: element.style.backgroundColor || 'transparent',
                      border: element.style.border ? `${element.style.border.width}px solid ${element.style.border.color}` : 'none',
                      borderRadius: element.style.border?.radius ? `${element.style.border.radius}px` : '4px',
                      boxShadow: element.style.boxShadow || 'none',
                      filter: element.style.filter || 'none',
                      opacity: element.style.opacity || 1,
                      minHeight: '20px',
                      minWidth: '20px',
                    }}
                  >
                    {element.type === 'picture' && (element.imageUrl || element.field) ? (
                      <img 
                        src={
                          // ถ้ามี field binding ให้ใช้ข้อมูลจาก field ก่อน
                          (element.field && userData) 
                            ? (element.field === 'profileImage' ? (userData?.avatar_url || userData?.user_metadata?.avatar_url) : 
                               element.field === 'companyLogo' ? (userData?.user_metadata?.company_logo) : null)
                            : element.imageUrl
                        } 
                        alt={element.field === 'profileImage' ? 'Profile Picture' : 
                             element.field === 'companyLogo' ? 'Company Logo' : 'Picture'} 
                        className="w-full h-full object-contain" 
                      />
                    ) : element.type === 'textarea' ? (
                      <textarea
                        value={getElementContent(element)}
                        readOnly
                        className="w-full h-full resize-none border-none outline-none bg-transparent"
                        style={{
                          fontSize: element.style.fontSize,
                          fontFamily: element.style.fontFamily || 'Arial',
                          fontWeight: element.style.fontWeight,
                          color: element.style.color,
                          textAlign: element.style.textAlign,
                        }}
                      />
                    ) : element.type === 'social' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {(() => {
                          const iconStyle = { 
                            display: 'inline-block'
                          };
                          
                          console.log('🎯 Canvas: element.field =', element.field, 'type =', typeof element.field);
                          console.log('🎯 Canvas: element.type =', element.type);
                          console.log('🎯 Canvas: element =', element);
                          console.log('🎯 TikTok field check:', element.field === 'tiktok', 'field value:', `"${element.field}"`);
                          
                          // Check if field is empty or undefined
                          if (!element.field || element.field === '') {
                            console.log('🎯 Field is empty, using default icon');
                            return <div style={{...iconStyle, width: '24px', height: '24px'}} className="bg-gray-400 rounded" />;
                          }
                          
                          switch (element.field) {
                            case 'facebook': return <Facebook size={24} style={iconStyle} className="text-blue-600" />;
                            case 'line': return <MessageCircle size={24} style={iconStyle} className="text-green-500" />;
                            case 'linkedin': return <Linkedin size={24} style={iconStyle} className="text-blue-700" />;
                            case 'twitter': return <Twitter size={24} style={iconStyle} className="text-blue-400" />;
                            case 'instagram': return <Instagram size={24} style={iconStyle} className="text-pink-500" />;
                            case 'tiktok': return <FaTiktok size={24} style={iconStyle} className="text-black" />;
                            case 'youtube': return <FaYoutube size={24} style={iconStyle} className="text-red-600" />;
                            case 'telegram': return <FaTelegram size={24} style={iconStyle} className="text-blue-500" />;
                            case 'whatsapp': return <FaWhatsapp size={24} style={iconStyle} className="text-green-600" />;
                            case 'wechat': return <MessageCircle size={24} style={iconStyle} className="text-green-700" />;
                            case 'snapchat': return <FaSnapchat size={24} style={iconStyle} className="text-yellow-500" />;
                            case 'pinterest': return <FaPinterest size={24} style={iconStyle} className="text-red-700" />;
                            case 'reddit': return <FaReddit size={24} style={iconStyle} className="text-orange-600" />;
                            case 'discord': return <FaDiscord size={24} style={iconStyle} className="text-indigo-600" />;
                            case 'slack': return <FaSlack size={24} style={iconStyle} className="text-purple-600" />;
                            case 'viber': return <FaViber size={24} style={iconStyle} className="text-purple-700" />;
                            case 'skype': return <FaSkype size={24} style={iconStyle} className="text-blue-600" />;
                            case 'zoom': return <Video size={24} style={iconStyle} className="text-blue-800" />;
                            case 'github': return <FaGithub size={24} style={iconStyle} className="text-gray-800" />;
                            case 'twitch': return <FaTwitch size={24} style={iconStyle} className="text-purple-800" />;
                            default: 
                              return <div style={{...iconStyle, width: '24px', height: '24px'}} className="bg-gray-400 rounded" />;
                          }
                        })()}
                        {element.type === 'social' ? (
                          <span 
                            className="truncate ml-2"
                            style={{
                              fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '14px',
                              fontFamily: element.style.fontFamily || 'Arial',
                              fontWeight: element.style.fontWeight,
                              color: element.style.color,
                              textAlign: element.style.textAlign,
                            }}
                          >
                            {getElementContent(element)}
                          </span>
                        ) : (
                          <span 
                            className="truncate"
                            style={{
                              fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '14px',
                              fontFamily: element.style.fontFamily || 'Arial',
                              fontWeight: element.style.fontWeight,
                              color: element.style.color,
                              textAlign: element.style.textAlign,
                            }}
                          >
                            {getElementContent(element)}
                          </span>
                        )}
                      </div>
                    ) : element.type === 'icon' ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          backgroundColor: element.style?.backgroundColor || 'transparent',
                          border: element.style?.border ? `${element.style.border.width}px solid ${element.style.border.color}` : 'none',
                          borderRadius: element.style?.border?.radius ? `${element.style.border.radius}px` : '0px',
                          padding: element.style?.padding ? `${element.style.padding}px` : '4px',
                          boxShadow: element.style?.boxShadow || 'none',
                          filter: element.style?.filter || 'none',
                          opacity: element.style?.opacity || 1
                        }}
                      >
                        {(() => {
                          
                          const IconComponent = getIconComponent(element.iconName || 'FaStar');
                          // Always calculate icon size from current element dimensions for responsive scaling
                          const iconSize = Math.min(element.width, element.height) * 0.6;
                          return (
                            <IconComponent 
                              size={Math.max(16, Math.min(iconSize, 512))} // Min 16px, Max 512px
                              style={{ 
                                color: element.style.color || '#000000',
                                display: 'block'
                              }} 
                            />
                          );
                        })()}
                      </div>
                    ) : element.type === 'qrcode' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <QRCodeCanvas
                          element={element}
                          content={getElementContent(element) || 'https://example.com'}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          fontSize: element.style.fontSize,
                          fontFamily: element.style.fontFamily || 'Arial',
                          fontWeight: element.style.fontWeight,
                          color: element.style.color,
                          textAlign: element.style.textAlign,
                        }}
                      >
                        {getElementContent(element)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
