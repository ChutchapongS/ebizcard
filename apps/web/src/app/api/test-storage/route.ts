import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Disable in production for security
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('🧪 Testing Supabase Storage connection...');
    console.log('🔍 Environment check:');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: List buckets
    console.log('📦 Testing bucket list...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Bucket list error:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError.message
      }, { status: 500 });
    }

    console.log('✅ Buckets found:', buckets.map(b => b.name));

    // Test 2: Check if avatars bucket exists
    const avatarsBucket = buckets.find(b => b.name === 'avatars');
    if (!avatarsBucket) {
      return NextResponse.json({
        success: false,
        error: 'avatars bucket not found',
        availableBuckets: buckets.map(b => b.name)
      }, { status: 404 });
    }

    console.log('✅ avatars bucket found:', avatarsBucket);

    // Test 3: Try to list files in avatars bucket
    console.log('📁 Testing file list in avatars bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 10 });

    if (filesError) {
      console.error('❌ File list error:', filesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list files in avatars bucket',
        details: filesError.message
      }, { status: 500 });
    }

    console.log('✅ Files in avatars bucket:', files);

    // Test 4: Try to upload a test file
    console.log('📤 Testing file upload...');
    const testContent = 'Test upload from API';
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload test error:', uploadError);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload test file',
        details: uploadError.message
      }, { status: 500 });
    }

    console.log('✅ Upload test successful:', uploadData);

    // Clean up test file
    await supabase.storage.from('avatars').remove([testFileName]);

    return NextResponse.json({
      success: true,
      message: 'All storage tests passed',
      buckets: buckets.map(b => b.name),
      avatarsBucket,
      filesInAvatars: files,
      uploadTest: 'success'
    });

  } catch (error) {
    console.error('❌ Test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: errorMessage,
      ...(errorStack && { stack: errorStack })
    }, { status: 500 });
  }
}
