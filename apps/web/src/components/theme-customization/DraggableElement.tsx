'use client';

import { CanvasElement } from '@/types/theme-customization';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Facebook, MessageCircle, Linkedin, Twitter, Instagram, Video, Send, Smartphone, Camera, Pin, Users, Hash, PhoneCall, Mic, Code, Gamepad2 } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { 
  FaPalette, FaStar, FaHeart, FaThumbsUp, FaFire, FaLightbulb,
  FaRocket, FaGem, FaBullseye, FaDumbbell, FaGift,
  FaTrophy, FaHome, FaBuilding, FaStore, FaHospital, FaSchool,
  FaIndustry, FaMobile, FaLaptop, FaCamera, FaMusic, FaFilm,
  FaBook, FaGamepad, FaUser, FaEnvelope, FaPhone, FaGlobe,
  FaFacebook, FaLinkedin, FaTwitter, FaInstagram, FaTiktok, FaYoutube, FaTelegram, FaWhatsapp, FaSnapchat, FaPinterest, FaReddit, FaDiscord, FaSlack, FaViber, FaSkype, FaGithub, FaTwitch
} from 'react-icons/fa';

interface DraggableElementProps {
  element: CanvasElement;
  content: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: (elementId: string) => void;
  onUpdate?: (element: CanvasElement) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  userData?: any;
}

// Function to get QR Code styling options based on style
const getQRCodeStyling = (qrStyle: string, qrColor?: string) => {
  const baseOptions = {
    width: 200,
    height: 200,
    type: 'svg' as const,
    data: '',
    backgroundOptions: {
      color: '#FFFFFF'
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: 'anonymous'
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
      
      
      const stylingOptions = getQRCodeStyling(element.qrStyle || 'black', element.qrColor);
      const qrCode = new QRCodeStyling({
        ...stylingOptions,
        width: Math.min(element.width - 8, element.height - 8),
        height: Math.min(element.width - 8, element.height - 8),
        data: content,
        backgroundOptions: {
          ...stylingOptions.backgroundOptions,
          color: element.style?.backgroundColor || stylingOptions.backgroundOptions.color
        },
        imageOptions: element.qrLogo ? {
          hideBackgroundDots: true,
          imageSize: 0.4, // Logo size relative to QR code (increased to 40% for better visibility)
          margin: 0,
          crossOrigin: 'anonymous'
        } : stylingOptions.imageOptions,
        image: element.qrLogo || undefined
      });
      
      qrCode.append(qrRef.current);
    }
  }, [element.qrStyle, element.qrColor, element.qrLogo, element.width, element.height, element.style?.backgroundColor, content]);

  return <div ref={qrRef} className="w-full h-full" />;
};

type ResizeDirection =
  | 'top-left' | 'top' | 'top-right'
  | 'right' | 'bottom-right' | 'bottom'
  | 'bottom-left' | 'left';

export function DraggableElement({
  element,
  content,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  canvasRef,
  userData
}: DraggableElementProps) {
  const dragData = useRef<any>({});
  const elementRef = useRef<HTMLDivElement | null>(null);

  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

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

  // Keyboard event handling for arrow keys
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return; // Only handle when no input is focused
      
      const step = e.shiftKey ? 5 : 1; // Shift + arrow = 5px, normal arrow = 1px
      let newX = element.x;
      let newY = element.y;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newY = Math.max(0, element.y - step);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newY = element.y + step;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newX = Math.max(0, element.x - step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newX = element.x + step;
          break;
        case 'Escape':
          e.preventDefault();
          return;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const rotationStep = e.shiftKey ? 5 : 1; // Shift + Ctrl+R = 5 degrees, Ctrl+R = 1 degree
            const currentRotation = element.style?.rotation || 0;
            const newRotation = currentRotation + rotationStep;
            
            const newElement = {
              ...element,
              style: {
                ...element.style,
                rotation: newRotation
              }
            };
            onUpdate?.(newElement);
          }
          return;
        case 'l':
        case 'L':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const rotationStep = e.shiftKey ? 5 : 1; // Shift + Ctrl+L = 5 degrees, Ctrl+L = 1 degree
            const currentRotation = element.style?.rotation || 0;
            const newRotation = currentRotation - rotationStep;
            
            const newElement = {
              ...element,
              style: {
    ...element.style,
                rotation: newRotation
              }
            };
            onUpdate?.(newElement);
          }
          return;
        default:
          return;
      }

      if (onUpdate) {
        onUpdate({
          ...element,
          x: newX,
          y: newY
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, element, onUpdate]);


  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleElementMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    dragData.current = {
      mode: 'drag',
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: element.x,
      startTop: element.y,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, dir: ResizeDirection) => {
    e.stopPropagation();
    setIsResizing(true);

    dragData.current = {
      mode: 'resize',
      id: element.id,
      corner: dir,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startLeft: element.x,
      startTop: element.y,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const elementCenterX = element.x + element.width / 2;
    const elementCenterY = element.y + element.height / 2;
    const startAngle = Math.atan2(e.clientY - canvasRect.top - elementCenterY, e.clientX - canvasRect.left - elementCenterX);

    dragData.current = {
      mode: 'rotate',
      id: element.id,
      startAngle: startAngle,
      startRotation: element.style?.rotation || 0,
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    const data = dragData.current;
    if (!data.id) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    if (data.mode === 'drag') {
      const deltaX = e.clientX - data.startX;
      const deltaY = e.clientY - data.startY;
      
      const newX = data.startLeft + deltaX;
      const newY = data.startTop + deltaY;
      
      const newElement = {
        ...element,
        x: newX,
        y: newY,
      };
      onUpdate?.(newElement);
    }

    if (data.mode === 'resize') {
      let newWidth = data.startWidth;
      let newHeight = data.startHeight;
      let newX = data.startLeft;
      let newY = data.startTop;

      const deltaX = e.clientX - data.startX;
      const deltaY = e.clientY - data.startY;

      // Handle horizontal resizing
      if (data.corner.includes('r')) {
        // Right edge: keep left edge fixed, adjust width
        newWidth = data.startWidth + deltaX;
      } else if (data.corner.includes('l')) {
        // Left edge: keep right edge fixed, adjust width and position
        newWidth = data.startWidth - deltaX;
        newX = data.startLeft + deltaX;
      }

      // Handle vertical resizing
      if (data.corner.includes('b')) {
        // Bottom edge: keep top edge fixed, adjust height
        newHeight = data.startHeight + deltaY;
      } else if (data.corner.includes('t')) {
        // Top edge: keep bottom edge fixed, adjust height and position
        newHeight = data.startHeight - deltaY;
        newY = data.startTop + deltaY;
      }

      const newElement = {
        ...element,
        x: newX,
        y: newY,
        width: Math.max(30, newWidth),
        height: Math.max(30, newHeight),
      };
      onUpdate?.(newElement);
    }

    if (data.mode === 'rotate') {
      const elementCenterX = element.x + element.width / 2;
      const elementCenterY = element.y + element.height / 2;
      const currentAngle = Math.atan2(e.clientY - canvasRect.top - elementCenterY, e.clientX - canvasRect.left - elementCenterX);
      let rotation = data.startRotation + (currentAngle - data.startAngle) * (180 / Math.PI);

      // If Shift is held, snap to 5-degree increments
      if (e.shiftKey) {
        rotation = Math.round(rotation / 5) * 5;
      }

      const newElement = {
        ...element,
        style: {
          ...element.style,
          rotation: rotation
        }
      };
      onUpdate?.(newElement);
    }
  };

  const handleMouseUp = () => {
    dragData.current = {};
    setIsResizing(false);
    setIsRotating(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handles: { dir: ResizeDirection; className: string; cursor: string }[] = [
    { dir: 'top-left', className: 'top-0 left-0 -mt-1 -ml-1', cursor: 'nwse-resize' },
    { dir: 'top', className: 'top-0 left-1/2 -mt-1 -ml-2', cursor: 'ns-resize' },
    { dir: 'top-right', className: 'top-0 right-0 -mt-1 -mr-1', cursor: 'nesw-resize' },
    { dir: 'right', className: 'top-1/2 right-0 -mr-1 -mt-2', cursor: 'ew-resize' },
    { dir: 'bottom-right', className: 'bottom-0 right-0 -mb-1 -mr-1', cursor: 'nwse-resize' },
    { dir: 'bottom', className: 'bottom-0 left-1/2 -mb-1 -ml-2', cursor: 'ns-resize' },
    { dir: 'bottom-left', className: 'bottom-0 left-0 -mb-1 -ml-1', cursor: 'nesw-resize' },
    { dir: 'left', className: 'top-1/2 left-0 -ml-1 -mt-2', cursor: 'ew-resize' },
  ];

  return (
    <div
      ref={elementRef}
      className={`absolute ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={{ 
        left: element.x, 
        top: element.y, 
        width: element.width, 
        height: element.height,
        transform: element.style?.rotation ? `rotate(${element.style.rotation}deg)` : 'none',
        transformOrigin: 'center'
      }}
      onClick={handleElementClick}
      onMouseDown={handleElementMouseDown}
    >
      {element.type === 'picture' ? (
        <div 
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: element.style?.border ? `${element.style.border.width}px solid ${element.style.border.color}` : 'none',
            borderRadius: element.style?.border?.radius ? `${element.style.border.radius}px` : '0px',
            padding: element.style?.padding ? `${element.style.padding}px` : '0px',
            boxShadow: element.style?.boxShadow || 'none',
            filter: element.style?.filter || 'none',
            opacity: element.style?.opacity || 1
          }}
        >
          {(element.imageUrl || element.field) ? (
            <div className="w-full h-full relative">
              <Image 
                src={
                  (element.field && userData) 
                    ? (element.field === 'profileImage'
                        ? (userData?.profileImage || userData?.avatar_url || userData?.user_metadata?.avatar_url || userData?.user_metadata?.profile_image || '')
                        : element.field === 'companyLogo'
                          ? (userData?.companyLogo || userData?.user_metadata?.company_logo || '')
                          : element.imageUrl)
                    : element.imageUrl || ''
                } 
                alt={element.field === 'profileImage' ? 'Profile Picture' : 
                     element.field === 'companyLogo' ? 'Company Logo' : 'Picture'} 
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 15vw, 40vw"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-400 flex items-center justify-center">
              <div className="text-gray-500 text-4xl">🖼️</div>
            </div>
          )}
        </div>
      ) : element.type === 'social' ? (
        <div 
          className="w-full h-full bg-white border border-gray-300 flex items-center select-none"
          style={{
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: element.style?.border ? `${element.style.border.width}px solid ${element.style.border.color}` : '1px solid #d1d5db',
            borderRadius: element.style?.border?.radius ? `${element.style.border.radius}px` : '4px',
            padding: element.style?.padding ? `${element.style.padding}px` : '4px',
            boxShadow: element.style?.boxShadow || 'none',
            filter: element.style?.filter || 'none',
            opacity: element.style?.opacity || 1,
            justifyContent: element.style?.textAlign === 'center' ? 'center' : element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
            alignItems: 'center'
          }}
        >
          <div 
            className="flex items-center space-x-2"
            style={{
              justifyContent: element.style?.textAlign === 'center' ? 'center' : element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start'
            }}
          >
            {element.field === 'facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
            {element.field === 'line' && <MessageCircle className="w-5 h-5 text-green-600" />}
            {element.field === 'linkedin' && <Linkedin className="w-5 h-5 text-blue-800" />}
            {element.field === 'twitter' && <Twitter className="w-5 h-5 text-blue-400" />}
            {element.field === 'instagram' && <Instagram className="w-5 h-5 text-pink-600" />}
            {element.field === 'tiktok' && <FaTiktok className="w-5 h-5 text-black" />}
            {element.field === 'youtube' && <FaYoutube className="w-5 h-5 text-red-600" />}
            {element.field === 'telegram' && <FaTelegram className="w-5 h-5 text-blue-500" />}
            {element.field === 'whatsapp' && <FaWhatsapp className="w-5 h-5 text-green-600" />}
            {element.field === 'wechat' && <MessageCircle className="w-5 h-5 text-green-700" />}
            {element.field === 'snapchat' && <FaSnapchat className="w-5 h-5 text-yellow-500" />}
            {element.field === 'pinterest' && <FaPinterest className="w-5 h-5 text-red-700" />}
            {element.field === 'reddit' && <FaReddit className="w-5 h-5 text-orange-600" />}
            {element.field === 'discord' && <FaDiscord className="w-5 h-5 text-indigo-600" />}
            {element.field === 'slack' && <FaSlack className="w-5 h-5 text-purple-600" />}
            {element.field === 'viber' && <FaViber className="w-5 h-5 text-purple-700" />}
            {element.field === 'skype' && <FaSkype className="w-5 h-5 text-blue-600" />}
            {element.field === 'zoom' && <Video className="w-5 h-5 text-blue-800" />}
            {element.field === 'github' && <FaGithub className="w-5 h-5 text-gray-800" />}
            {element.field === 'twitch' && <FaTwitch className="w-5 h-5 text-purple-800" />}
            <span 
              className="text-sm"
              style={{
                fontSize: element.style?.fontSize || 14,
                fontFamily: element.style?.fontFamily || 'Arial',
                fontWeight: element.style?.fontWeight || 'normal',
                fontStyle: element.style?.fontStyle || 'normal',
                textDecoration: element.style?.textDecoration || 'none',
                textDecorationStyle: element.style?.textDecorationStyle || 'solid',
                color: element.style?.color || '#000000'
              }}
            >
              {content}
            </span>
          </div>
        </div>
      ) : element.type === 'qrcode' ? (
        <div 
          className="w-full h-full bg-white border border-gray-300 flex items-center justify-center select-none"
          style={{
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: element.style?.border ? `${element.style.border.width}px solid ${element.style.border.color}` : '1px solid #d1d5db',
            borderRadius: element.style?.border?.radius ? `${element.style.border.radius}px` : '4px',
            padding: element.style?.padding ? `${element.style.padding}px` : '4px',
            boxShadow: element.style?.boxShadow || 'none',
            filter: element.style?.filter || 'none',
            opacity: element.style?.opacity || 1
          }}
        >
          <QRCodeCanvas
            element={element}
            content={content || 'https://example.com'}
          />
        </div>
      ) : element.type === 'icon' ? (
        <div 
          className="w-full h-full bg-white border border-gray-300 flex items-center justify-center select-none"
          style={{
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: element.style?.border ? `${element.style.border.width}px solid ${element.style.border.color}` : '1px solid #d1d5db',
            borderRadius: element.style?.border?.radius ? `${element.style.border.radius}px` : '4px',
            padding: element.style?.padding ? `${element.style.padding}px` : '4px',
            boxShadow: element.style?.boxShadow || 'none',
            filter: element.style?.filter || 'none',
            opacity: element.style?.opacity || 1
          }}
        >
          <div 
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {element.iconName ? (
              (() => {
                const IconComponent = getIconComponent(element.iconName);
                // Always calculate icon size from current element dimensions for responsive scaling
                const iconSize = Math.min(element.width, element.height) * 0.6;
                return (
                  <IconComponent 
                    size={Math.max(16, Math.min(iconSize, 512))} // Min 16px, Max 512px
                    style={{ 
                      color: element.style?.color || '#000000',
                      display: 'block'
                    }} 
                  />
                );
              })()
            ) : (
              <span 
                style={{
                  fontSize: Math.min(element.width, element.height) * 0.6,
                  color: '#9ca3af'
                }}
              >
                🎨
              </span>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full bg-white border border-gray-300 flex items-center select-none"
          style={{
            backgroundColor: element.style?.backgroundColor || 'transparent',
            border: element.style?.border ? `${element.style.border.width}px solid ${element.style.border.color}` : '1px solid #d1d5db',
            borderRadius: element.style?.border?.radius ? `${element.style.border.radius}px` : '4px',
            padding: element.style?.padding ? `${element.style.padding}px` : '4px',
            boxShadow: element.style?.boxShadow || 'none',
            filter: element.style?.filter || 'none',
            opacity: element.style?.opacity || 1,
            justifyContent: element.style?.textAlign === 'center' ? 'center' : element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
            alignItems: 'center'
          }}
        >
          {element.type === 'textarea' ? (
            <div
              style={{
                fontSize: element.style?.fontSize || 16,
                fontFamily: element.style?.fontFamily || 'Arial',
                fontWeight: element.style?.fontWeight || 'normal',
                fontStyle: element.style?.fontStyle || 'normal',
                textDecoration: element.style?.textDecoration || 'none',
                textDecorationStyle: element.style?.textDecorationStyle || 'solid',
                color: element.style?.color || '#000000',
                textAlign: element.style?.textAlign || 'left',
                padding: element.style?.padding ? `${element.style.padding}px` : '0px',
                width: '100%',
                height: '100%',
                whiteSpace: 'pre-wrap', // Preserve line breaks
                overflow: 'hidden',
                wordWrap: 'break-word'
              }}
            >
              {content}
            </div>
          ) : (
            <div
              style={{
                fontSize: element.style?.fontSize || 16,
                fontFamily: element.style?.fontFamily || 'Arial',
                fontWeight: element.style?.fontWeight || 'normal',
                fontStyle: element.style?.fontStyle || 'normal',
                textDecoration: element.style?.textDecoration || 'none',
                textDecorationStyle: element.style?.textDecorationStyle || 'solid',
                color: element.style?.color || '#000000',
                textAlign: element.style?.textAlign || 'left',
                padding: element.style?.padding ? `${element.style.padding}px` : '0px',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: element.style?.textAlign === 'center' ? 'center' : element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start'
              }}
            >
              {content}
            </div>
          )}
        </div>
      )}

      {isSelected &&
        handles.map(h => (
          <div
            key={h.dir}
            className={`absolute w-3 h-3 bg-blue-500 border border-white rounded-sm ${h.className}`}
            style={{ cursor: h.cursor }}
            onMouseDown={(e) => handleResizeMouseDown(e, h.dir)}
          />
        ))}

      {/* Rotate handle */}
      {isSelected && (
        <div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center cursor-grab hover:bg-blue-600"
          onMouseDown={handleRotateMouseDown}
          title="Rotate element"
        >
          ↻
        </div>
      )}

      {/* Delete button */}
      {isSelected && onDelete && (
        <div
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(element.id);
          }}
        >
          ×
        </div>
      )}
    </div>
  );
}
