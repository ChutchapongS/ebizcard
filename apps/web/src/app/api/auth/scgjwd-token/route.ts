import { NextResponse } from 'next/server';

/**
 * Exchange authorization code from SCGJWD User Portal for access/refresh tokens.
 */
export async function POST(request: Request) {
  try {
    const tokenUrl = process.env.USER_PORTAL_TOKEN_URL;
    const clientId =
      process.env.USER_PORTAL_CLIENT_ID || process.env.NEXT_PUBLIC_USER_PORTAL_CLIENT_ID || 'e-BizCard';
    const clientSecret = process.env.USER_PORTAL_CLIENT_SECRET;

    // ตรวจสอบ configuration
    if (!tokenUrl) {
      console.error('❌ USER_PORTAL_TOKEN_URL is not configured');
      return NextResponse.json(
        { 
          error: 'User portal token endpoint is not configured',
          details: 'Please set USER_PORTAL_TOKEN_URL in your environment variables'
        },
        { status: 500 },
      );
    }

    if (!clientSecret) {
      console.error('❌ USER_PORTAL_CLIENT_SECRET is not configured');
      return NextResponse.json(
        { 
          error: 'User portal client secret is not configured',
          details: 'Please set USER_PORTAL_CLIENT_SECRET in your environment variables'
        },
        { status: 500 },
      );
    }

    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      console.error('❌ Missing required parameters:', { code: !!code, redirectUri: !!redirectUri });
      return NextResponse.json(
        { error: 'Missing authorization code or redirect URI' },
        { status: 400 },
      );
    }

    console.log('🔄 Exchanging authorization code for token...');
    console.log('Token URL:', tokenUrl);
    console.log('Client ID:', clientId);
    console.log('Code:', code.substring(0, 10) + '...');
    console.log('Redirect URI:', redirectUri);

    // OAuth 2.0 token endpoints มักต้องการ application/x-www-form-urlencoded
    // แทน application/json
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    console.log('📤 Sending token exchange request (form-urlencoded)...');
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to exchange authorization code';
      let errorDetails = errorText;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
        errorDetails = errorJson.error_description || errorDetails;
      } catch {
        // If not JSON, use the text as-is
      }

      console.error('❌ SCGJWD token exchange failed:', {
        url: tokenUrl,
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        details: errorDetails
      });

      // ถ้าเป็น 405 อาจเป็นเพราะ method หรือ Content-Type ผิด
      if (response.status === 405) {
        return NextResponse.json(
          { 
            error: 'Method Not Allowed (405)',
            details: `User Portal does not accept POST to ${tokenUrl}. Please check if the endpoint URL is correct and supports POST method with application/x-www-form-urlencoded.`,
            status: response.status,
            url: tokenUrl
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          status: response.status,
          url: tokenUrl
        },
        { status: 502 },
      );
    }

    const tokenData = await response.json();
    console.log('✅ Token exchange successful');
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('❌ SCGJWD token exchange error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}

