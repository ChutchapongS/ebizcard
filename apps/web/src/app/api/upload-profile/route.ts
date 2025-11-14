import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('profile') as File;
    const accessToken = formData.get('access_token') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Create Supabase client with Service Role Key for admin operations
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookies().get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookies().set(name, value, options);
            } catch (error) {
              // Handle cookie setting errors
            }
          },
          remove(name: string, options: any) {
            try {
              cookies().set(name, '', options);
            } catch (error) {
              // Handle cookie removal errors
            }
          },
        },
      }
    );

    // Get current user from the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token', details: authError?.message },
        { status: 401 }
      );
    }

    // Generate unique filename with user ID
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `profile-${user.id}-${timestamp}.${fileExtension}`;
    const filePath = `profiles/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to avatars bucket (we know it exists and works)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update profiles table with the uploaded URL using Service Role Key
    const { error: profileUpdateError } = await (supabase
      .from('profiles') as any)
      .upsert({
        id: user.id,
        email: user.email,
        avatar_url: publicUrl,
        profile_image: publicUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileUpdateError) {
      console.error('❌ ไม่สามารถอัปเดต profiles table:', profileUpdateError);
      // Continue anyway, the image is uploaded successfully
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      url: publicUrl,
      filename: fileName,
      bucket: 'avatars',
      size: file.size
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}
