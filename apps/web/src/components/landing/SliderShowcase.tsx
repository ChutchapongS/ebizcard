'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface SlideItem {
  title: string;
  description: string;
  highlights: string[];
  accent?: string;
  image_url?: string;
  background_type?: 'color' | 'image';
}

const defaultSlides: SlideItem[] = [
  {
    title: 'สร้างนามบัตรดิจิทัลได้ในไม่กี่คลิก',
    description:
      'เลือกรูปแบบที่ต้องการ ปรับแต่งข้อมูลครบถ้วน พร้อมลิงก์แชร์ทันที รองรับทั้งไทยและอังกฤษ',
    highlights: ['Template มืออาชีพ', 'แก้ไขแบบเรียลไทม์', 'แสดงผลได้ทุกอุปกรณ์'],
    accent: '#3b82f6',
  },
  {
    title: 'แชร์ข้อมูลครบ ใช้งานสะดวก',
    description:
      'ส่งต่อผ่าน QR Code, ลิงก์, หรือดาวน์โหลด vCard ให้ผู้รับเก็บข้อมูลติดต่อได้ทันที',
    highlights: ['QR Code & vCard', 'เมนู Contact เดียวจบ', 'รองรับ Social & Map'],
    accent: '#10b981',
  },
  {
    title: 'ติดตามการใช้งานแบบเรียลไทม์',
    description:
      'รู้ว่ามีใครเข้าชมการ์ดของคุณ และดาวน์โหลดข้อมูลไปบ้าง เพื่อวางแผนต่อยอดทางธุรกิจ',
    highlights: ['สถิติการเข้าชม', 'บันทึกผู้ดาวน์โหลด', 'พร้อมข้อมูลเชิงลึก'],
    accent: '#f97316',
  },
];

export const SliderShowcase = () => {
  const [slides, setSlides] = useState<SlideItem[]>(defaultSlides);
  const [current, setCurrent] = useState(0);
  const [sectionBackground, setSectionBackground] = useState<string>('#111827');

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/admin/web-settings');
        if (!response.ok) {
          throw new Error('Failed to load slider data');
        }
        const data = await response.json();
        
        // Load slider section background
        if (data?.settings?.slider_section_background) {
          setSectionBackground(data.settings.slider_section_background);
        }
        
        const sliderData = data?.settings?.home_slider;
        if (sliderData) {
          let parsed: SlideItem[] | null = null;
          if (typeof sliderData === 'string') {
            try {
              parsed = JSON.parse(sliderData);
            } catch (parseError) {
              console.warn('Unable to parse slider data string', parseError);
            }
          } else if (Array.isArray(sliderData)) {
            parsed = sliderData as SlideItem[];
          }

          if (parsed && parsed.length > 0) {
            // Map the parsed data to ensure all fields are present
            const mappedSlides = parsed.map((item: any) => ({
              title: item.title || '',
              description: item.description || '',
              highlights: Array.isArray(item.highlights) ? item.highlights : [],
              accent: item.use_transparent ? undefined : (item.accent || ''),
              image_url: item.image_url || '',
              background_type: item.background_type || (item.image_url ? 'image' : 'color'),
            }));
            setSlides(mappedSlides);
            setCurrent(0);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch slider data, using defaults', error);
      }
    };

    fetchSlides();

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      fetchSlides();
    };

    window.addEventListener('webSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('webSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => {
        const length = slides.length || defaultSlides.length;
        return (prev + 1) % length;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (index: number) => {
    const length = slides.length || defaultSlides.length;
    setCurrent((index + length) % length);
  };

  const activeSlides = slides.length > 0 ? slides : defaultSlides;
  const currentSlide = activeSlides[current] ?? activeSlides[0];

  return (
    <section 
      className="relative overflow-hidden py-16 sm:py-20"
      style={{
        background: sectionBackground?.startsWith('linear-gradient')
          ? sectionBackground
          : sectionBackground || '#111827',
      }}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary-400 via-transparent to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
          <div className="w-full lg:w-1/2">
            <p className="uppercase tracking-[0.35em] text-xs sm:text-sm text-primary-200 mb-4">
              eBizCard Update
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
              {currentSlide.title}
            </h2>
            <p className="text-base sm:text-lg text-gray-200 mb-6">
              {currentSlide.description}
            </p>
            <ul className="space-y-3">
              {currentSlide.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start text-gray-100">
                  <span className="mt-1 mr-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500/90 text-xs font-semibold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative">
              <div className="h-64 sm:h-72 md:h-80 lg:h-96 rounded-3xl overflow-hidden border-2 border-teal-400/50 shadow-2xl relative">
                {(currentSlide.background_type === 'image' || (!currentSlide.background_type && currentSlide.image_url)) && currentSlide.image_url ? (
                  <Image
                    src={currentSlide.image_url}
                    alt={currentSlide.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    unoptimized
                  />
                ) : (
                  <div
                    className={`h-full w-full flex items-center justify-center ${
                      !currentSlide.accent ? 'bg-gradient-to-br from-primary-500 via-primary-300 to-blue-500' : ''
                    }`}
                    style={{
                      background: currentSlide.accent
                        ? (currentSlide.accent.startsWith('linear-gradient')
                            ? currentSlide.accent
                            : currentSlide.accent)
                        : undefined,
                    }}
                  >
                    <div className="text-center px-8 sm:px-12">
                      <span className="inline-flex items-center px-4 py-2 mb-6 rounded-full bg-white/10 text-white text-sm font-semibold border border-white/20">
                        eBizCard Platform
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                        {currentSlide.title}
                      </h3>
                      <p className="text-base text-gray-200">
                        {currentSlide.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-x-0 -bottom-6 flex justify-center gap-2">
                {activeSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      current === index ? 'w-10 bg-white' : 'w-6 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`แสดงสไลด์ที่ ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => goTo(current - 1)}
                className="flex items-center gap-2 text-gray-100 hover:text-white transition-colors"
              >
                <span className="h-10 w-10 rounded-full border border-white/30 flex items-center justify-center">
                  <ArrowLeft className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium uppercase tracking-wide">
                  ก่อนหน้า
                </span>
              </button>

              <button
                onClick={() => goTo(current + 1)}
                className="flex items-center gap-2 text-gray-100 hover:text-white transition-colors"
              >
                <span className="text-sm font-medium uppercase tracking-wide">
                  ถัดไป
                </span>
                <span className="h-10 w-10 rounded-full border border-white/30 flex items-center justify-center">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

