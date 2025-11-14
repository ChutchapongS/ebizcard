import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔧 Testing Supabase Storage with Admin privileges...');
    
    // Use service role key if available, otherwise use anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    console.log('🔍 Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: List buckets with admin privileges
    console.log('📦 Testing bucket list with admin privileges...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Bucket list error:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError.message,
        keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'
      }, { status: 500 });
    }

    console.log('✅ Buckets found:', buckets.map(b => b.name));

    // Test 2: Check if avatars bucket exists
    const avatarsBucket = buckets.find(b => b.name === 'avatars');
    if (!avatarsBucket) {
      return NextResponse.json({
        success: false,
        error: 'avatars bucket not found',
        availableBuckets: buckets.map(b => b.name),
        keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'
      }, { status: 404 });
    }

    console.log('✅ avatars bucket found:', avatarsBucket);

    // Test 3: Try to upload a test image
    console.log('📤 Testing image upload...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testImageBuffer = Buffer.from(testImageData, 'base64');
    const testFileName = `test-admin-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testImageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload test error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload test file',
        details: uploadError.message,
        keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'
      }, { status: 500 });
    }

    console.log('✅ Upload test successful:', uploadData);

    // Clean up test file
    await supabase.storage.from('avatars').remove([testFileName]);

    return NextResponse.json({
      success: true,
      message: 'All storage tests passed with admin privileges',
      buckets: buckets.map(b => b.name),
      avatarsBucket,
      uploadTest: 'success',
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'
    });

  } catch (error: any) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message,
      stack: error.stack,
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon'
    }, { status: 500 });
  }
}
