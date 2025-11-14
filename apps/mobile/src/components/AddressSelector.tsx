import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { 
  getProvinces, 
  getDistricts, 
  getTambons, 
  getPostalCode 
} from '../utils/address';

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
  disabled?: boolean;
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  value = { province: '', district: '', tambon: '', postalCode: '' },
  onChange,
  disabled = false
}) => {
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [tambons, setTambons] = useState<string[]>([]);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showTambonModal, setShowTambonModal] = useState(false);

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

  const handleProvinceSelect = (province: string) => {
    onChange({
      province,
      district: '',
      tambon: '',
      postalCode: ''
    });
    setShowProvinceModal(false);
  };

  const handleDistrictSelect = (district: string) => {
    const postalCode = getPostalCode(value.province, district);
    onChange({
      province: value.province,
      district,
      tambon: '',
      postalCode: postalCode ? postalCode.toString() : ''
    });
    setShowDistrictModal(false);
  };

  const handleTambonSelect = (tambon: string) => {
    onChange({
      ...value,
      tambon
    });
    setShowTambonModal(false);
  };

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    data: string[],
    onSelect: (item: string) => void,
    selectedValue: string
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>ปิด</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.listItem,
                selectedValue === item && styles.selectedItem
              ]}
              onPress={() => onSelect(item)}
            >
              <Text style={[
                styles.listItemText,
                selectedValue === item && styles.selectedItemText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Province Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.label}>จังหวัด *</Text>
        <TouchableOpacity
          style={[styles.selector, disabled && styles.disabled]}
          onPress={() => !disabled && setShowProvinceModal(true)}
        >
          <Text style={[styles.selectorText, !value.province && styles.placeholder]}>
            {value.province || 'เลือกจังหวัด'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* District Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.label}>อำเภอ/เขต *</Text>
        <TouchableOpacity
          style={[
            styles.selector, 
            (!value.province || disabled) && styles.disabled
          ]}
          onPress={() => !disabled && value.province && setShowDistrictModal(true)}
        >
          <Text style={[
            styles.selectorText, 
            !value.district && styles.placeholder
          ]}>
            {value.district || 'เลือกอำเภอ/เขต'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tambon Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.label}>ตำบล/แขวง *</Text>
        <TouchableOpacity
          style={[
            styles.selector, 
            (!value.district || disabled) && styles.disabled
          ]}
          onPress={() => !disabled && value.district && setShowTambonModal(true)}
        >
          <Text style={[
            styles.selectorText, 
            !value.tambon && styles.placeholder
          ]}>
            {value.tambon || 'เลือกตำบล/แขวง'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Postal Code Display */}
      {value.postalCode && (
        <View style={styles.selectorContainer}>
          <Text style={styles.label}>รหัสไปรษณีย์</Text>
          <View style={[styles.selector, styles.disabled]}>
            <Text style={styles.selectorText}>
              {value.postalCode}
            </Text>
          </View>
        </View>
      )}

      {/* Modals */}
      {renderModal(
        showProvinceModal,
        () => setShowProvinceModal(false),
        'เลือกจังหวัด',
        provinces,
        handleProvinceSelect,
        value.province
      )}

      {renderModal(
        showDistrictModal,
        () => setShowDistrictModal(false),
        'เลือกอำเภอ/เขต',
        districts,
        handleDistrictSelect,
        value.district
      )}

      {renderModal(
        showTambonModal,
        () => setShowTambonModal(false),
        'เลือกตำบล/แขวง',
        tambons,
        handleTambonSelect,
        value.tambon
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  selectorContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  disabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  selectorText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedItem: {
    backgroundColor: '#EFF6FF',
  },
  listItemText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedItemText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default AddressSelector;
