'use client';

import React, { useState, useEffect } from 'react';
import { 
  getProvinces, 
  getDistricts, 
  getTambons, 
  getPostalCode,
  formatFullAddress 
} from '@/utils/address';

interface AddressSelectorProps {
  value?: {
    province: string;
    district: string;
    tambon: string;
    postalCode: string;
  };
  onChange: (address: {
    province: string;
    district: string;
    tambon: string;
    postalCode: string;
  }) => void;
  className?: string;
  disabled?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  value = { province: '', district: '', tambon: '', postalCode: '' },
  onChange,
  className = '',
  disabled = false
}) => {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [tambons, setTambons] = useState<string[]>([]);

  // Load provinces on mount
  useEffect(() => {
    setProvinces(getProvinces());
  }, []);

  // Update districts when province changes
  useEffect(() => {
    if (value.province) {
      const newDistricts = getDistricts(value.province);
      setDistricts(newDistricts);
      
      // Reset district, tambon, and postal code if province changed
      if (!newDistricts.includes(value.district)) {
        onChange({
          province: value.province,
          district: '',
          tambon: '',
          postalCode: ''
        });
      }
    } else {
      setDistricts([]);
    }
  }, [value.province]);

  // Update tambons when district changes
  useEffect(() => {
    if (value.province && value.district) {
      const newTambons = getTambons(value.province, value.district);
      setTambons(newTambons);
      
      // Get postal code for the district
      const postalCode = getPostalCode(value.province, value.district);
      
      // Reset tambon if district changed
      if (!newTambons.includes(value.tambon)) {
        onChange({
          province: value.province,
          district: value.district,
          tambon: '',
          postalCode: postalCode ? postalCode.toString() : ''
        });
      } else if (postalCode && value.postalCode !== postalCode.toString()) {
        // Update postal code if it changed
        onChange({
          province: value.province,
          district: value.district,
          tambon: value.tambon,
          postalCode: postalCode.toString()
        });
      }
    } else {
      setTambons([]);
    }
  }, [value.province, value.district]);

  const handleProvinceChange = (province: string) => {
    onChange({
      province,
      district: '',
      tambon: '',
      postalCode: ''
    });
  };

  const handleDistrictChange = (district: string) => {
    const postalCode = getPostalCode(value.province, district);
    onChange({
      province: value.province,
      district,
      tambon: '',
      postalCode: postalCode ? postalCode.toString() : ''
    });
  };

  const handleTambonChange = (tambon: string) => {
    onChange({
      ...value,
      tambon
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Province Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          จังหวัด *
        </label>
        <select
          value={value.province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          disabled={disabled}
          className="input"
        >
          <option value="">เลือกจังหวัด</option>
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>

      {/* District Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          อำเภอ/เขต *
        </label>
        <select
          value={value.district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={disabled || !value.province}
          className="input"
        >
          <option value="">เลือกอำเภอ/เขต</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      {/* Tambon Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ตำบล/แขวง *
        </label>
        <select
          value={value.tambon}
          onChange={(e) => handleTambonChange(e.target.value)}
          disabled={disabled || !value.district}
          className="input"
        >
          <option value="">เลือกตำบล/แขวง</option>
          {tambons.map((tambon) => (
            <option key={tambon} value={tambon}>
              {tambon}
            </option>
          ))}
        </select>
      </div>

      {/* Postal Code Display */}
      {value.postalCode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            รหัสไปรษณีย์
          </label>
          <input
            type="text"
            value={value.postalCode}
            disabled
            className="input bg-gray-100"
            placeholder="รหัสไปรษณีย์จะแสดงอัตโนมัติ"
          />
        </div>
      )}
    </div>
  );
};

export default AddressSelector;
