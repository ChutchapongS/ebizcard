import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔧 Setting up storage buckets...');

    const bucketsToCreate = [
      {
        id: 'avatars',
        name: 'avatars',
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
      }
    ];

    const results = [];

    for (const bucketConfig of bucketsToCreate) {
      console.log(`📦 Creating bucket: ${bucketConfig.id}`);
      
      // Try to create bucket
      const { data: bucket, error: createError } = await supabaseAdmin.storage.createBucket(
        bucketConfig.id,
        {
          public: bucketConfig.public,
          fileSizeLimit: bucketConfig.fileSizeLimit,
          allowedMimeTypes: bucketConfig.allowedMimeTypes
        }
      );

      if (createError) {
        // If bucket already exists, that's okay
        if (createError.message.includes('already exists')) {
          console.log(`✅ Bucket ${bucketConfig.id} already exists`);
          results.push({
            bucket: bucketConfig.id,
            status: 'exists',
            message: 'Bucket already exists'
          });
        } else {
          console.error(`❌ Error creating bucket ${bucketConfig.id}:`, createError);
          results.push({
            bucket: bucketConfig.id,
            status: 'error',
            error: createError.message
          });
        }
      } else {
        console.log(`✅ Bucket ${bucketConfig.id} created successfully`);
        results.push({
          bucket: bucketConfig.id,
          status: 'created',
          data: bucket
        });
      }
    }

    // Test upload to verify bucket works
    console.log('🧪 Testing upload to avatars bucket...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'Test upload';
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
      return NextResponse.json({
        success: false,
        message: 'Buckets created but test upload failed',
        results,
        testUploadError: uploadError.message
      }, { status: 500 });
    }

    console.log('✅ Test upload successful');

    // Clean up test file
    await supabaseAdmin.storage.from('avatars').remove([testFileName]);

    return NextResponse.json({
      success: true,
      message: 'Storage setup completed successfully',
      results,
      testUpload: 'success'
    });

  } catch (error: any) {
    console.error('❌ Storage setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
}

