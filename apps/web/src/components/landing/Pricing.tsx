'use client';

import React from 'react';
import { Check, Star } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: 'เดือน',
    description: 'เหมาะสำหรับการใช้งานส่วนตัว',
    features: [
      'สร้างนามบัตรได้ 3 ใบ',
      'QR Code generation',
      'Public card pages',
      'vCard export',
      'Basic analytics',
      'Mobile & Web access'
    ],
    cta: 'เริ่มต้นฟรี',
    popular: false
  },
  {
    name: 'Pro',
    price: '299',
    period: 'เดือน',
    description: 'เหมาะสำหรับผู้ประกอบการและธุรกิจ',
    features: [
      'สร้างนามบัตรไม่จำกัด',
      'QR Code generation',
      'Public card pages',
      'vCard export',
      'Advanced analytics',
      'Contact management',
      'Custom templates',
      'Priority support',
      'API access'
    ],
    cta: 'เริ่มใช้ Pro',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'เหมาะสำหรับองค์กรขนาดใหญ่',
    features: [
      'ทุกฟีเจอร์ใน Pro',
      'White-label solution',
      'Custom branding',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Advanced security',
      'Team management'
    ],
    cta: 'ติดต่อเรา',
    popular: false
  }
];

export const Pricing = () => {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            เริ่มต้นฟรีและอัปเกรดเมื่อต้องการฟีเจอร์เพิ่มเติม
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    แนะนำ
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 'Custom' ? plan.price : `฿${plan.price}`}
                  </span>
                  {plan.period && (
                    <span className="text-gray-600 ml-1">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="w-5 h-5 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                  plan.popular
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            มีคำถามเกี่ยวกับแพ็กเกจ? ติดต่อเราได้เลย
          </p>
          <button className="btn-secondary">
            ติดต่อทีมขาย
          </button>
        </div>
      </div>
    </div>
  );
};
