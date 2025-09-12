'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">e-BizCard</h3>
            <p className="text-gray-300 mb-6 max-w-md">
              แพลตฟอร์มสร้างและแชร์นามบัตรดิจิทัลที่ทันสมัย 
              พร้อม QR Code และการติดตาม Analytics
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">ลิงก์ด่วน</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
                  ฟีเจอร์
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  ราคา
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray-300 hover:text-white transition-colors">
                  เอกสาร
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                  บล็อก
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-4">การสนับสนุน</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white transition-colors">
                  วิธีใช้งาน
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  ติดต่อเรา
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  นโยบายความเป็นส่วนตัว
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  เงื่อนไขการใช้งาน
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-primary-500 mr-3" />
              <span className="text-gray-300">hello@ebizcard.com</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-primary-500 mr-3" />
              <span className="text-gray-300">+66 2-123-4567</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-primary-500 mr-3" />
              <span className="text-gray-300">กรุงเทพมหานคร, ประเทศไทย</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 e-BizCard. สงวนลิขสิทธิ์ทั้งหมด
          </p>
        </div>
      </div>
    </footer>
  );
};
