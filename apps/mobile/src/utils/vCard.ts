import { BusinessCard, SocialLinks } from '../types';

export const generateVCard = (card: BusinessCard): string => {
  const socialLinks = card.social_links as SocialLinks || {};
  
  let vcard = 'BEGIN:VCARD\n';
  vcard += 'VERSION:3.0\n';
  vcard += `FN:${card.name}\n`;
  vcard += `N:${card.name.split(' ').reverse().join(';')};;;\n`;
  
  if (card.job_title) {
    vcard += `TITLE:${card.job_title}\n`;
  }
  
  if (card.company) {
    vcard += `ORG:${card.company}\n`;
  }
  
  if (card.phone) {
    vcard += `TEL:${card.phone}\n`;
  }
  
  if (card.email) {
    vcard += `EMAIL:${card.email}\n`;
  }
  
  if (card.address) {
    vcard += `ADR:;;${card.address};;;;\n`;
  }
  
  if (socialLinks.website) {
    vcard += `URL:${socialLinks.website}\n`;
  }
  
  if (socialLinks.linkedin) {
    vcard += `URL:${socialLinks.linkedin}\n`;
  }
  
  vcard += 'END:VCARD';
  
  return vcard;
};

export const downloadVCard = async (card: BusinessCard) => {
  try {
    const vcardContent = generateVCard(card);
    const blob = new Blob([vcardContent], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.name.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading vCard:', error);
    throw error;
  }
};
