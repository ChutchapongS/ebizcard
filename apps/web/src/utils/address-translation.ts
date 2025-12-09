/**
 * Utility functions for displaying Thai address names in Thai or English
 * Uses data from kongvut/thai-province-data repository
 * 
 * Data structure expected:
 * - provinces: { id, name_th, name_en }
 * - districts: { id, name_th, name_en, province_id }
 * - sub_districts: { id, name_th, name_en, district_id }
 */

// Import address data (Thai only - current structure)
// @ts-ignore - address.js is a data file
import { address } from '../data/address.js';

// Bilingual data structure
let bilingualData: {
  provinces?: Array<{ id: number; name_th: string; name_en: string }>;
  districts?: Array<{ id: number; name_th: string; name_en: string; province_id: number }>;
  sub_districts?: Array<{ id: number; name_th: string; name_en: string; district_id: number }>;
} = {};

// Fallback mapping for sub-districts that are not in bilingual data
// Format: "province|district|subdistrict" => "English Name"
const subDistrictFallback: Record<string, string> = {
  'กรุงเทพมหานคร|บางซื่อ|วงศ์สว่าง': 'Wong Sawang',
  // Add more fallback mappings here as needed
};

// Load bilingual data dynamically (will be loaded when available)
let dataLoaded = false;

/**
 * Load bilingual data from thai-province-data repository
 * This should be called once when the app initializes
 */
export const loadBilingualData = async () => {
  if (dataLoaded) return;
  
  try {
    // Try to load data from thai-province-data directory
    // Using dynamic import with type assertion
    const provincesModule = await import('../data/thai-province-data/provinces.json' as any);
    const districtsModule = await import('../data/thai-province-data/districts.json' as any);
    const subDistrictsModule = await import('../data/thai-province-data/sub_districts.json' as any);
    
    bilingualData = {
      provinces: provincesModule.default || provincesModule,
      districts: districtsModule.default || districtsModule,
      sub_districts: subDistrictsModule.default || subDistrictsModule,
    };
    dataLoaded = true;
  } catch (e) {
    // Bilingual data not available, will use Thai names only
    console.warn('Bilingual address data not found. Using Thai names only.');
    console.warn('Please download data from: https://github.com/kongvut/thai-province-data');
    console.warn('And place in: apps/web/src/data/thai-province-data/');
  }
};

/**
 * Get province English name from bilingual data
 */
export const getProvinceEnglishName = (thaiName: string): string | null => {
  if (!bilingualData.provinces) return null;
  const province = bilingualData.provinces.find(p => p.name_th === thaiName);
  return province?.name_en || null;
};

/**
 * Get district English name from bilingual data
 */
export const getDistrictEnglishName = (thaiName: string, provinceThaiName: string): string | null => {
  if (!bilingualData.districts || !bilingualData.provinces) return null;
  
  // Find province ID
  const province = bilingualData.provinces.find(p => p.name_th === provinceThaiName);
  if (!province) return null;
  
  // For Bangkok (กรุงเทพมหานคร), the bilingual data uses "เขต" prefix
  // but address.js doesn't have the prefix, so we need to try both
  let district = bilingualData.districts.find(
    d => d.name_th === thaiName && d.province_id === province.id
  );
  
  // If not found and province is Bangkok, try with "เขต" prefix
  if (!district && provinceThaiName === 'กรุงเทพมหานคร' && !thaiName.startsWith('เขต')) {
    district = bilingualData.districts.find(
      d => d.name_th === `เขต${thaiName}` && d.province_id === province.id
    );
  }
  
  // If still not found and has "เขต" prefix, try without it
  if (!district && thaiName.startsWith('เขต')) {
    district = bilingualData.districts.find(
      d => d.name_th === thaiName && d.province_id === province.id
    );
  }
  
  if (!district) return null;
  
  // For Bangkok, remove "Khet " prefix from English name
  let englishName = district.name_en;
  if (provinceThaiName === 'กรุงเทพมหานคร' && englishName && englishName.startsWith('Khet ')) {
    englishName = englishName.replace(/^Khet /, '');
  }
  
  return englishName;
};

/**
 * Get sub-district (tambon) English name from bilingual data
 */
export const getSubDistrictEnglishName = (
  thaiName: string,
  districtThaiName: string,
  provinceThaiName: string
): string | null => {
  if (!bilingualData.sub_districts || !bilingualData.districts || !bilingualData.provinces) return null;
  
  // Find province ID
  const province = bilingualData.provinces.find(p => p.name_th === provinceThaiName);
  if (!province) return null;
  
  // Find district ID - handle Bangkok case where address.js doesn't have "เขต" prefix
  let district = bilingualData.districts.find(
    d => d.name_th === districtThaiName && d.province_id === province.id
  );
  
  // If not found and province is Bangkok, try with "เขต" prefix
  if (!district && provinceThaiName === 'กรุงเทพมหานคร' && !districtThaiName.startsWith('เขต')) {
    district = bilingualData.districts.find(
      d => d.name_th === `เขต${districtThaiName}` && d.province_id === province.id
    );
  }
  
  // If still not found and has "เขต" prefix, try without it
  if (!district && districtThaiName.startsWith('เขต')) {
    district = bilingualData.districts.find(
      d => d.name_th === districtThaiName && d.province_id === province.id
    );
  }
  
  if (!district) return null;
  
  // Find sub-district by name and district_id
  const subDistrict = bilingualData.sub_districts.find(
    s => s.name_th === thaiName && s.district_id === district.id
  );
  
  // If found in bilingual data, return English name
  if (subDistrict?.name_en) {
    return subDistrict.name_en;
  }
  
  // Fallback: check if we have a manual mapping
  // Normalize district name (remove "เขต" prefix for lookup)
  const normalizedDistrict = districtThaiName.startsWith('เขต') 
    ? districtThaiName.replace(/^เขต/, '') 
    : districtThaiName;
  const fallbackKey = `${provinceThaiName}|${normalizedDistrict}|${thaiName}`;
  const fallbackName = subDistrictFallback[fallbackKey];
  
  return fallbackName || null;
};

/**
 * Translate province name from Thai to English (using bilingual data)
 */
export const translateProvince = (thaiName: string, isEnglish: boolean): string => {
  if (!isEnglish) return thaiName;
  const englishName = getProvinceEnglishName(thaiName);
  return englishName || thaiName;
};

/**
 * Translate district name from Thai to English (using bilingual data)
 */
export const translateDistrict = (thaiName: string, provinceThaiName: string, isEnglish: boolean): string => {
  if (!isEnglish) return thaiName;
  const englishName = getDistrictEnglishName(thaiName, provinceThaiName);
  return englishName || thaiName;
};

/**
 * Translate tambon name from Thai to English (using bilingual data)
 */
export const translateTambon = (
  thaiName: string,
  districtThaiName: string,
  provinceThaiName: string,
  isEnglish: boolean
): string => {
  if (!isEnglish) return thaiName;
  const englishName = getSubDistrictEnglishName(thaiName, districtThaiName, provinceThaiName);
  return englishName || thaiName;
};

/**
 * Get display text for dropdown options
 */
export const getDisplayText = (
  thaiName: string,
  englishName: string | null,
  isEnglish: boolean,
  removeKhetPrefix: boolean = false
): string => {
  if (!isEnglish) return thaiName;
  if (englishName && englishName !== thaiName) {
    // Remove "Khet " prefix if requested (for Bangkok districts)
    let displayEnglishName = englishName;
    if (removeKhetPrefix && englishName.startsWith('Khet ')) {
      displayEnglishName = englishName.replace(/^Khet /, '');
    }
    return `${displayEnglishName} (${thaiName})`;
  }
  return thaiName;
};

/**
 * Get display text for province dropdown
 */
export const getProvinceDisplayText = (thaiName: string, isEnglish: boolean): string => {
  if (!isEnglish) return thaiName;
  const englishName = getProvinceEnglishName(thaiName);
  return getDisplayText(thaiName, englishName, isEnglish);
};

/**
 * Get display text for district dropdown
 */
export const getDistrictDisplayText = (
  thaiName: string,
  provinceThaiName: string,
  isEnglish: boolean
): string => {
  if (!isEnglish) return thaiName;
  const englishName = getDistrictEnglishName(thaiName, provinceThaiName);
  // getDistrictEnglishName already removes "Khet " prefix for Bangkok, so no need for removeKhetPrefix
  return getDisplayText(thaiName, englishName, isEnglish);
};

/**
 * Get display text for sub-district dropdown
 */
export const getSubDistrictDisplayText = (
  thaiName: string,
  districtThaiName: string,
  provinceThaiName: string,
  isEnglish: boolean
): string => {
  if (!isEnglish) return thaiName;
  const englishName = getSubDistrictEnglishName(thaiName, districtThaiName, provinceThaiName);
  return getDisplayText(thaiName, englishName, isEnglish);
};

/**
 * Convert address data from Thai names to English names
 * This is used before saving to database when user selected English
 */
export const convertAddressToEnglish = (
  addressData: {
    province?: string;
    district?: string;
    tambon?: string;
    [key: string]: any;
  }
): {
  province?: string;
  district?: string;
  tambon?: string;
  [key: string]: any;
} => {
  const result = { ...addressData };
  
  // Convert province
  if (addressData.province) {
    const englishName = getProvinceEnglishName(addressData.province);
    if (englishName) {
      result.province = englishName;
    }
  }
  
  // Convert district (needs province for lookup)
  if (addressData.district && addressData.province) {
    // Use original Thai province name for lookup
    const englishName = getDistrictEnglishName(addressData.district, addressData.province);
    if (englishName) {
      result.district = englishName;
    }
  }
  
  // Convert tambon (needs district and province for lookup)
  if (addressData.tambon && addressData.district && addressData.province) {
    // Use original Thai names for lookup
    const englishName = getSubDistrictEnglishName(addressData.tambon, addressData.district, addressData.province);
    if (englishName) {
      result.tambon = englishName;
    }
  }
  
  return result;
};

/**
 * Get province Thai name from English name (reverse lookup)
 * Used when loading data from Supabase that might be in English
 */
export const getProvinceThaiName = (englishName: string): string | null => {
  if (!bilingualData.provinces) return null;
  const province = bilingualData.provinces.find(p => p.name_en === englishName);
  return province?.name_th || null;
};

/**
 * Get district Thai name from English name (reverse lookup)
 * Used when loading data from Supabase that might be in English
 */
export const getDistrictThaiName = (englishName: string, provinceEnglishName: string): string | null => {
  if (!bilingualData.districts || !bilingualData.provinces) return null;
  
  // Find province ID from English name
  const province = bilingualData.provinces.find(p => p.name_en === provinceEnglishName);
  if (!province) return null;
  
  // For Bangkok, try to find district with "Khet " prefix first (old data format)
  // then try without prefix (new data format)
  let district = bilingualData.districts.find(
    d => d.name_en === englishName && d.province_id === province.id
  );
  
  // If not found and province is Bangkok, try with "Khet " prefix
  if (!district && province.name_th === 'กรุงเทพมหานคร' && !englishName.startsWith('Khet ')) {
    district = bilingualData.districts.find(
      d => d.name_en === `Khet ${englishName}` && d.province_id === province.id
    );
  }
  
  if (!district) return null;
  
  // For Bangkok, remove "เขต" prefix to match address.js format
  let thaiName = district.name_th;
  if (province.name_th === 'กรุงเทพมหานคร' && thaiName.startsWith('เขต')) {
    thaiName = thaiName.replace(/^เขต/, '');
  }
  
  return thaiName;
};

/**
 * Get sub-district (tambon) Thai name from English name (reverse lookup)
 * Used when loading data from Supabase that might be in English
 */
export const getSubDistrictThaiName = (
  englishName: string,
  districtEnglishName: string,
  provinceEnglishName: string
): string | null => {
  if (!bilingualData.sub_districts || !bilingualData.districts || !bilingualData.provinces) return null;
  
  // Find province ID from English name
  const province = bilingualData.provinces.find(p => p.name_en === provinceEnglishName);
  if (!province) return null;
  
  // Find district ID from English name
  // Handle Bangkok case where district name might have "Khet" prefix
  let district = bilingualData.districts.find(
    d => d.name_en === districtEnglishName && d.province_id === province.id
  );
  
  // If not found and province is Bangkok, try with "Khet " prefix
  if (!district && province.name_th === 'กรุงเทพมหานคร' && !districtEnglishName.startsWith('Khet ')) {
    district = bilingualData.districts.find(
      d => d.name_en === `Khet ${districtEnglishName}` && d.province_id === province.id
    );
  }
  
  if (!district) return null;
  
  // Find sub-district by English name and district_id
  const subDistrict = bilingualData.sub_districts.find(
    s => s.name_en === englishName && s.district_id === district.id
  );
  
  // If found in bilingual data, return Thai name
  if (subDistrict?.name_th) {
    return subDistrict.name_th;
  }
  
  // Fallback: check if we have a manual mapping (reverse lookup)
  // Normalize district name (remove "เขต" prefix for lookup)
  const normalizedDistrict = district.name_th.startsWith('เขต') 
    ? district.name_th.replace(/^เขต/, '') 
    : district.name_th;
  const fallbackKey = `${province.name_th}|${normalizedDistrict}|`;
  
  // Find the Thai name that maps to this English name
  for (const [key, fallbackEnglishName] of Object.entries(subDistrictFallback)) {
    if (fallbackEnglishName === englishName && key.startsWith(fallbackKey)) {
      const parts = key.split('|');
      if (parts.length === 3) {
        return parts[2]; // Return the Thai sub-district name
      }
    }
  }
  
  return null;
};

/**
 * Check if address data is in English format
 * Returns true if province, district, or tambon is in English (not found in Thai address data)
 */
export const isAddressInEnglish = (
  addressData: {
    province?: string;
    district?: string;
    tambon?: string;
  }
): boolean => {
  // If no province, cannot determine, assume Thai
  if (!addressData.province) {
    return false;
  }
  
  const provinces = Object.keys(address);
  
  // Check if province exists in Thai address data
  const isProvinceThai = provinces.includes(addressData.province);
  
  if (!isProvinceThai) {
    // Province not found in Thai data, definitely English
    return true;
  }
  
  // Province is Thai, check district
  if (addressData.district) {
    const districts = Object.keys((address as any)[addressData.province] || {});
    const isDistrictThai = districts.includes(addressData.district);
    
    if (!isDistrictThai) {
      // District not found in Thai data, likely English
      return true;
    }
    
    // District is Thai, check tambon
    if (addressData.tambon) {
      const tambons = ((address as any)[addressData.province]?.[addressData.district]?.Tambons || []);
      const isTambonThai = tambons.includes(addressData.tambon);
      
      if (!isTambonThai) {
        // Tambon not found in Thai data, likely English
        return true;
      }
    }
  }
  
  // All fields found in Thai data, assume Thai
  return false;
};

/**
 * Convert address data from English names back to Thai names
 * This is used when loading data from Supabase that was saved in English
 * to match with dropdown values which use Thai names
 */
export const convertAddressToThai = (
  addressData: {
    province?: string;
    district?: string;
    tambon?: string;
    [key: string]: any;
  }
): {
  province?: string;
  district?: string;
  tambon?: string;
  [key: string]: any;
} => {
  const result = { ...addressData };
  
  // Convert province from English to Thai
  if (addressData.province) {
    // Check if it's already a Thai name by checking if it exists in address data
    const provinces = Object.keys(address);
    const isAlreadyThai = provinces.includes(addressData.province);
    
    if (!isAlreadyThai) {
      // Try to convert from English to Thai
      const thaiName = getProvinceThaiName(addressData.province);
      if (thaiName) {
        result.province = thaiName;
      }
    }
    // If already Thai, keep the original value
  }
  
  // Convert district from English to Thai (needs province for lookup)
  if (addressData.district && addressData.province) {
    // First check if province was converted
    const provinceToUse = result.province || addressData.province;
    
    // Check if district is already Thai by checking if it exists in address data
    const districts = Object.keys((address as any)[provinceToUse] || {});
    const isAlreadyThai = districts.includes(addressData.district);
    
    if (!isAlreadyThai) {
      // Use original English province name for lookup (before conversion)
      const thaiName = getDistrictThaiName(addressData.district, addressData.province);
      if (thaiName) {
        result.district = thaiName;
      }
    }
    // If already Thai, keep the original value
  }
  
  // Convert tambon from English to Thai (needs district and province for lookup)
  if (addressData.tambon && addressData.district && addressData.province) {
    // First check if province and district were converted
    const provinceToUse = result.province || addressData.province;
    const districtToUse = result.district || addressData.district;
    
    // Check if tambon is already Thai by checking if it exists in address data
    const tambons = ((address as any)[provinceToUse]?.[districtToUse]?.Tambons || []);
    const isAlreadyThai = tambons.includes(addressData.tambon);
    
    if (!isAlreadyThai) {
      // Use original English names for lookup (before conversion)
      const thaiName = getSubDistrictThaiName(addressData.tambon, addressData.district, addressData.province);
      if (thaiName) {
        result.tambon = thaiName;
      }
    }
    // If already Thai, keep the original value
  }
  
  return result;
};

/**
 * Get formatted address example text
 * Returns address with province, district, and sub-district in the selected language
 * For English mode, shows only English names (not "English (Thai)" format like dropdown)
 */
export const getFormattedAddressExample = (
  address: string,
  tambon: string,
  district: string,
  province: string,
  postalCode: string,
  isEnglish: boolean
): string => {
  const parts: string[] = [];
  
  if (address) parts.push(address);
  
  if (tambon) {
    if (isEnglish) {
      const englishName = getSubDistrictEnglishName(tambon, district, province);
      parts.push(englishName || tambon);
    } else {
      parts.push(tambon);
    }
  }
  
  if (district) {
    if (isEnglish) {
      const englishName = getDistrictEnglishName(district, province);
      parts.push(englishName || district);
    } else {
      parts.push(district);
    }
  }
  
  if (province) {
    if (isEnglish) {
      const englishName = getProvinceEnglishName(province);
      parts.push(englishName || province);
    } else {
      parts.push(province);
    }
  }
  
  if (postalCode) parts.push(postalCode);
  
  return parts.join(', ');
};
