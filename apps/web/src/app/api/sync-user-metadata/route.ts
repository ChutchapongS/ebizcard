import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: NextRequest) {
  try {
    // Check environment variables first
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase environment variables'
      }, { status: 500 });
    }

    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. ดึงข้อมูลที่อยู่จาก table addresses
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (addressesError) {
      console.error('Error fetching addresses:', addressesError);
      return NextResponse.json({ 
        error: 'Failed to fetch addresses',
        details: addressesError.message
      }, { status: 500 });
    }

    // 2. ดึงข้อมูล user ปัจจุบัน
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ 
        error: 'Failed to fetch user',
        details: userError.message
      }, { status: 500 });
    }
    
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. สร้าง metadata ใหม่
    const currentMetadata = user.user_metadata || {};
    
    // อัพเดตข้อมูลที่อยู่
    if (addresses && addresses.length > 0) {
      const primaryAddress = addresses.find(addr => addr.is_primary) || addresses[0];
      
      // รวมที่อยู่
      const addressParts = [];
      if (primaryAddress.address) addressParts.push(primaryAddress.address);
      if (primaryAddress.tambon) addressParts.push(primaryAddress.tambon);
      if (primaryAddress.district) addressParts.push(primaryAddress.district);
      if (primaryAddress.province) addressParts.push(primaryAddress.province);
      if (primaryAddress.postal_code) addressParts.push(primaryAddress.postal_code);
      
      const combinedAddress = addressParts.join(' ');
      
      // อัพเดต metadata
      const updatedMetadata = {
        ...currentMetadata,
        address: combinedAddress,
        address_detail: primaryAddress.address,
        tambon: primaryAddress.tambon,
        district: primaryAddress.district,
        province: primaryAddress.province,
        postal_code: primaryAddress.postal_code,
        place: primaryAddress.place,
        addresses: addresses // เก็บข้อมูล addresses ทั้งหมด
      };

      // 4. อัพเดต user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: updatedMetadata
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update user metadata',
          details: updateError.message
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User metadata synced successfully',
        data: {
          addresses: addresses.length,
          primaryAddress: combinedAddress
        }
      });
    } else {
      // ไม่มีข้อมูลที่อยู่ ให้ลบข้อมูลที่อยู่จาก metadata
      const updatedMetadata = {
        ...currentMetadata,
        address: '',
        address_detail: '',
        tambon: '',
        district: '',
        province: '',
        postal_code: '',
        place: '',
        addresses: []
      };

      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: updatedMetadata
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update user metadata',
          details: updateError.message
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User metadata cleared (no addresses found)',
        data: { addresses: 0 }
      });
    }

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
