import { address } from '../../../../address.js';

// Interface สำหรับข้อมูลที่อยู่
export interface AddressData {
  province: string;
  district: string;
  tambon: string;
  postalCode: number;
}

// Interface สำหรับข้อมูลจังหวัด
export interface ProvinceData {
  name: string;
  districts: string[];
}

// Interface สำหรับข้อมูลอำเภอ/เขต
export interface DistrictData {
  name: string;
  tambons: string[];
  postalCode: number;
}

/**
 * ดึงรายชื่อจังหวัดทั้งหมด
 * @returns Array ของชื่อจังหวัด
 */
export const getProvinces = (): string[] => {
  return Object.keys(address);
};

/**
 * ดึงรายชื่ออำเภอ/เขตทั้งหมดในจังหวัดที่ระบุ
 * @param province - ชื่อจังหวัด
 * @returns Array ของชื่ออำเภอ/เขต
 */
export const getDistricts = (province: string): string[] => {
  if (!province || !address[province]) {
    return [];
  }
  return Object.keys(address[province]);
};

/**
 * ดึงรายชื่อตำบล/แขวงทั้งหมดในอำเภอ/เขตที่ระบุ
 * @param province - ชื่อจังหวัด
 * @param district - ชื่ออำเภอ/เขต
 * @returns Array ของชื่อตำบล/แขวง
 */
export const getTambons = (province: string, district: string): string[] => {
  if (!province || !district || !address[province] || !address[province][district]) {
    return [];
  }
  return address[province][district].Tambons || [];
};

/**
 * ดึงรหัสไปรษณีย์ของอำเภอ/เขตที่ระบุ
 * @param province - ชื่อจังหวัด
 * @param district - ชื่ออำเภอ/เขต
 * @returns รหัสไปรษณีย์
 */
export const getPostalCode = (province: string, district: string): number | null => {
  if (!province || !district || !address[province] || !address[province][district]) {
    return null;
  }
  return address[province][district].PostCode || null;
};

/**
 * ดึงข้อมูลที่อยู่ทั้งหมดในรูปแบบที่พร้อมใช้งาน
 * @param province - ชื่อจังหวัด
 * @param district - ชื่ออำเภอ/เขต
 * @returns ข้อมูลที่อยู่รวม
 */
export const getAddressData = (province: string, district: string): DistrictData | null => {
  if (!province || !district || !address[province] || !address[province][district]) {
    return null;
  }
  
  const districtData = address[province][district];
  return {
    name: district,
    tambons: districtData.Tambons || [],
    postalCode: districtData.PostCode || 0
  };
};

/**
 * ค้นหาข้อมูลที่อยู่จากรหัสไปรษณีย์
 * @param postalCode - รหัสไปรษณีย์
 * @returns Array ของข้อมูลที่อยู่ที่ตรงกับรหัสไปรษณีย์
 */
export const searchByPostalCode = (postalCode: number): AddressData[] => {
  const results: AddressData[] = [];
  
  Object.keys(address).forEach(province => {
    Object.keys(address[province]).forEach(district => {
      const districtData = address[province][district];
      if (districtData.PostCode === postalCode) {
        districtData.Tambons.forEach((tambon: string) => {
          results.push({
            province,
            district,
            tambon,
            postalCode
          });
        });
      }
    });
  });
  
  return results;
};

/**
 * ค้นหาข้อมูลที่อยู่จากชื่อตำบล/แขวง
 * @param tambonName - ชื่อตำบล/แขวง
 * @returns Array ของข้อมูลที่อยู่ที่ตรงกับชื่อตำบล/แขวง
 */
export const searchByTambon = (tambonName: string): AddressData[] => {
  const results: AddressData[] = [];
  
  Object.keys(address).forEach(province => {
    Object.keys(address[province]).forEach(district => {
      const districtData = address[province][district];
      districtData.Tambons.forEach((tambon: string) => {
        if (tambon.includes(tambonName)) {
          results.push({
            province,
            district,
            tambon,
            postalCode: districtData.PostCode
          });
        }
      });
    });
  });
  
  return results;
};

/**
 * ตรวจสอบว่าข้อมูลที่อยู่ที่ระบุมีอยู่จริงหรือไม่
 * @param province - ชื่อจังหวัด
 * @param district - ชื่ออำเภอ/เขต
 * @param tambon - ชื่อตำบล/แขวง
 * @returns boolean
 */
export const validateAddress = (province: string, district: string, tambon: string): boolean => {
  if (!province || !district || !tambon) {
    return false;
  }
  
  const tambons = getTambons(province, district);
  return tambons.includes(tambon);
};

/**
 * สร้างข้อความที่อยู่แบบเต็ม
 * @param addressData - ข้อมูลที่อยู่
 * @returns ข้อความที่อยู่แบบเต็ม
 */
export const formatFullAddress = (addressData: {
  address?: string;
  tambon?: string;
  district?: string;
  province?: string;
  postalCode?: string | number;
  country?: string;
}): string => {
  const parts: string[] = [];
  
  if (addressData.address) parts.push(addressData.address);
  if (addressData.tambon) parts.push(addressData.tambon);
  if (addressData.district) parts.push(addressData.district);
  if (addressData.province) parts.push(addressData.province);
  if (addressData.postalCode) parts.push(addressData.postalCode.toString());
  if (addressData.country) parts.push(addressData.country);
  
  return parts.join(' ');
};

/**
 * ดึงข้อมูลจังหวัดพร้อมอำเภอ/เขตทั้งหมด
 * @returns Array ของข้อมูลจังหวัด
 */
export const getAllProvincesWithDistricts = (): ProvinceData[] => {
  return Object.keys(address).map(province => ({
    name: province,
    districts: getDistricts(province)
  }));
};

/**
 * ดึงข้อมูลอำเภอ/เขตพร้อมตำบล/แขวงทั้งหมด
 * @param province - ชื่อจังหวัด
 * @returns Array ของข้อมูลอำเภอ/เขต
 */
export const getAllDistrictsWithTambons = (province: string): DistrictData[] => {
  if (!province || !address[province]) {
    return [];
  }
  
  return Object.keys(address[province]).map(district => ({
    name: district,
    tambons: getTambons(province, district),
    postalCode: getPostalCode(province, district) || 0
  }));
};
