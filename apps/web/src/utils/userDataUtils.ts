// Shared utility functions for userData across all pages
export interface UserData {
  name: string;
  nameEn: string;
  personalId: string;
  personalPhone: string;
  personalEmail: string;
  workName: string;
  workDepartment: string;
  workPosition: string;
  workPhone: string;
  workEmail: string;
  workWebsite: string;
  taxIdMain: string;
  taxIdBranch: string;
  facebook: string;
  lineId: string;
  linkedin: string;
  twitter: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  telegram: string;
  whatsapp: string;
  wechat: string;
  snapchat: string;
  pinterest: string;
  reddit: string;
  discord: string;
  slack: string;
  viber: string;
  skype: string;
  zoom: string;
  github: string;
  twitch: string;
  addresses: Address[];
  user_metadata: {
    personal_address_1_id?: string;
    personal_address_2_id?: string;
    work_address_1_id?: string;
    work_address_2_id?: string;
    [key: string]: any;
  };
  avatar_url?: string;
  profileImage?: string;
  companyLogo?: string;
  logo_url?: string;
  user_plan?: string;
}

export interface Address {
  id: string;
  type: 'personal_1' | 'personal_2' | 'work_1' | 'work_2';
  address?: string;
  street?: string;
  tambon?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postal_code?: string;
  postalCode?: string;
}

// Function to format address with prefix
export function formatAddress(address: Address, useAddressPrefix: boolean = true): string {
  if (!address) return '';
  
  const addressParts = [];
  
  // Add street address
  if (address.address || address.street) {
    addressParts.push(address.address || address.street);
  }
  
  // Add tambon/subdistrict
  if (address.tambon || address.subdistrict) {
    const tambon = address.tambon || address.subdistrict;
    if (useAddressPrefix) {
      if (address.province === 'กรุงเทพมหานคร') {
        addressParts.push(`แขวง${tambon}`);
      } else {
        addressParts.push(`ตำบล${tambon}`);
      }
    } else {
      addressParts.push(tambon);
    }
  }
  
  // Add district
  if (address.district) {
    if (useAddressPrefix) {
      if (address.province === 'กรุงเทพมหานคร') {
        addressParts.push(`เขต${address.district}`);
      } else {
        addressParts.push(`อำเภอ${address.district}`);
      }
    } else {
      addressParts.push(address.district);
    }
  }
  
  // Add province
  if (address.province) {
    if (useAddressPrefix) {
      addressParts.push(`จังหวัด${address.province}`);
    } else {
      addressParts.push(address.province);
    }
  }
  
  // Add postal code
  if (address.postal_code || address.postalCode) {
    addressParts.push(address.postal_code || address.postalCode);
  }
  
  return addressParts.join(' ');
}

// Function to get address by type
export function getAddressByType(addresses: Address[], type: 'personal_1' | 'personal_2' | 'work_1' | 'work_2'): Address | null {
  if (!addresses) return null;
  
  const foundAddress = addresses.find(addr => addr.type === type) || null;
  
  return foundAddress;
}

// Function to get address by ID reference
export function getAddressById(addresses: Address[], addressId: string): Address | null {
  if (!addresses || !addressId) return null;
  return addresses.find(addr => addr.id === addressId) || null;
}

// Function to create standardized userData object
export function createUserData(profileData: any, user: any, addresses: Address[]): UserData {
  return {
    name: profileData.full_name || user.user_metadata?.full_name || '',
    nameEn: profileData.full_name_english || user.user_metadata?.full_name_english || '',
    personalId: profileData.personal_id || user.user_metadata?.personal_id || '',
    personalPhone: profileData.personal_phone || user.user_metadata?.personal_phone || '',
    personalEmail: user.email || '',
    workName: profileData.company || user.user_metadata?.company || '',
    workDepartment: profileData.department || user.user_metadata?.department || '',
    workPosition: profileData.job_title || user.user_metadata?.job_title || '',
    workPhone: profileData.work_phone || user.user_metadata?.work_phone || '',
    workEmail: profileData.work_email || user.user_metadata?.work_email || '',
    workWebsite: profileData.website || user.user_metadata?.website || '',
    taxIdMain: profileData.tax_id_main || user.user_metadata?.tax_id_main || '',
    taxIdBranch: profileData.tax_id_branch || user.user_metadata?.tax_id_branch || '',
    facebook: profileData.facebook || user.user_metadata?.facebook || '',
    lineId: profileData.line_id || user.user_metadata?.line_id || '',
    linkedin: profileData.linkedin || user.user_metadata?.linkedin || '',
    twitter: profileData.twitter || user.user_metadata?.twitter || '',
    instagram: profileData.instagram || user.user_metadata?.instagram || '',
    tiktok: profileData.tiktok || user.user_metadata?.tiktok || '',
    youtube: profileData.youtube || user.user_metadata?.youtube || '',
    telegram: profileData.telegram || user.user_metadata?.telegram || '',
    whatsapp: profileData.whatsapp || user.user_metadata?.whatsapp || '',
    wechat: profileData.wechat || user.user_metadata?.wechat || '',
    snapchat: profileData.snapchat || user.user_metadata?.snapchat || '',
    pinterest: profileData.pinterest || user.user_metadata?.pinterest || '',
    reddit: profileData.reddit || user.user_metadata?.reddit || '',
    discord: profileData.discord || user.user_metadata?.discord || '',
    slack: profileData.slack || user.user_metadata?.slack || '',
    viber: profileData.viber || user.user_metadata?.viber || '',
    skype: profileData.skype || user.user_metadata?.skype || '',
    zoom: profileData.zoom || user.user_metadata?.zoom || '',
    github: profileData.github || user.user_metadata?.github || '',
    twitch: profileData.twitch || user.user_metadata?.twitch || '',
    addresses: addresses || [],
    user_metadata: {
      personal_address_1_id: profileData.personal_address_1_id,
      personal_address_2_id: profileData.personal_address_2_id,
      work_address_1_id: profileData.work_address_1_id,
      work_address_2_id: profileData.work_address_2_id,
      avatar_url: profileData.avatar_url,
      company_logo: profileData.company_logo,
      ...user.user_metadata
    },
    avatar_url: profileData.avatar_url,
    profileImage: profileData.avatar_url,
    companyLogo: profileData.company_logo,
    logo_url: profileData.company_logo,
    user_plan: profileData.user_plan || 'Free'
  };
}

// Function to get field value for TemplatePreview
export function getUserFieldValue(field: string, userData: UserData, useAddressPrefix: boolean = true): string {
  if (!userData || !field) return '';
  
  
  const fieldMap: { [key: string]: string } = {
    'name': userData.name,
    'nameEn': userData.nameEn,
    'personalId': userData.personalId,
    'personalPhone': userData.personalPhone,
    'personalEmail': userData.personalEmail,
    'workName': userData.workName,
    'workDepartment': userData.workDepartment,
    'workPosition': userData.workPosition,
    'workPhone': userData.workPhone,
    'workEmail': userData.workEmail,
    'workWebsite': userData.workWebsite,
    'taxIdMain': userData.taxIdMain,
    'taxIdBranch': userData.taxIdBranch,
    'personalAddress1': formatAddress(getAddressByType(userData.addresses, 'personal_1') || {} as Address, useAddressPrefix),
    'personalAddress2': formatAddress(getAddressByType(userData.addresses, 'personal_2') || {} as Address, useAddressPrefix),
    'workAddress1': formatAddress(getAddressByType(userData.addresses, 'work_1') || {} as Address, useAddressPrefix),
    'workAddress2': formatAddress(getAddressByType(userData.addresses, 'work_2') || {} as Address, useAddressPrefix),
    'address': userData.addresses?.[0]?.address || '',
    'facebook': userData.facebook,
    'line': userData.lineId,
    'linkedin': userData.linkedin,
    'twitter': userData.twitter,
    'instagram': userData.instagram,
    'tiktok': userData.tiktok,
    'youtube': userData.youtube,
    'telegram': userData.telegram,
    'whatsapp': userData.whatsapp,
    'wechat': userData.wechat,
    'snapchat': userData.snapchat,
    'pinterest': userData.pinterest,
    'reddit': userData.reddit,
    'discord': userData.discord,
    'slack': userData.slack,
    'viber': userData.viber,
    'skype': userData.skype,
    'zoom': userData.zoom,
    'github': userData.github,
    'twitch': userData.twitch
  };
  
  return fieldMap[field] || '';
}
