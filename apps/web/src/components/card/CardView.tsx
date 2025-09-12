'use client';

import React from 'react';
import { Download, Phone, Mail, MapPin, Globe, Linkedin, Twitter, Github } from 'lucide-react';
import { BusinessCard } from '@/types';
import { generateVCard, downloadVCard } from '@/utils/vCard';

interface CardViewProps {
  card: BusinessCard;
}

export const CardView: React.FC<CardViewProps> = ({ card }) => {
  const socialLinks = card.social_links as any || {};

  const handleDownloadVCard = async () => {
    try {
      await downloadVCard(card);
    } catch (error) {
      console.error('Error downloading vCard:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card Container */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-12 text-white">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {card.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{card.name}</h1>
            {card.job_title && (
              <p className="text-xl text-primary-100 mb-1">{card.job_title}</p>
            )}
            {card.company && (
              <p className="text-lg text-primary-200">{card.company}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Contact Information */}
          <div className="space-y-4 mb-8">
            {card.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <a 
                  href={`tel:${card.phone}`}
                  className="text-gray-700 hover:text-primary-500 transition-colors"
                >
                  {card.phone}
                </a>
              </div>
            )}
            
            {card.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <a 
                  href={`mailto:${card.email}`}
                  className="text-gray-700 hover:text-primary-500 transition-colors"
                >
                  {card.email}
                </a>
              </div>
            )}
            
            {card.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{card.address}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(socialLinks.website || socialLinks.linkedin || socialLinks.twitter || socialLinks.github) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ติดตามฉัน</h3>
              <div className="flex flex-wrap gap-4">
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    เว็บไซต์
                  </a>
                )}
                
                {socialLinks.linkedin && (
                  <a
                    href={socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    LinkedIn
                  </a>
                )}
                
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    Twitter
                  </a>
                )}
                
                {socialLinks.github && (
                  <a
                    href={socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleDownloadVCard}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              บันทึกเป็น Contact
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-gray-500 text-sm">
        <p>สร้างด้วย e-BizCard - นามบัตรดิจิทัล</p>
      </div>
    </div>
  );
};
