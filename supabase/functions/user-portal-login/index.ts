// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const mapDepartmentToRole = (department)=>{
  if (!department) return 'user';
  const normalized = department.toLowerCase();
  if (normalized === 'it' || normalized === 'information technology') {
    return 'admin';
  }
  return 'user';
};
const getUserByEmail = async (supabaseUrl, serviceRoleKey, email)=>{
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`
    }
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to lookup user: ${res.status} ${body}`);
  }
  const payload = await res.json();
  return payload?.users?.[0] ?? null;
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get authorization code from request
    const { code, redirectUri } = await req.json();
    if (!code) {
      return new Response(JSON.stringify({
        error: 'Authorization code is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Create Supabase client with Service Role Key (for admin operations)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Get User Portal configuration from environment variables
    const userPortalTokenUrl = Deno.env.get('USER_PORTAL_TOKEN_URL');
    const userPortalProfileUrl = Deno.env.get('USER_PORTAL_PROFILE_URL') || userPortalTokenUrl?.replace('/api/auth/token', '/api/user/getprofile') || userPortalTokenUrl?.replace('/oauth/token', '/api/user/getprofile');
    const userPortalClientId = Deno.env.get('USER_PORTAL_CLIENT_ID') || Deno.env.get('NEXT_PUBLIC_USER_PORTAL_CLIENT_ID') || 'e-BizCard';
    const userPortalClientSecret = Deno.env.get('USER_PORTAL_CLIENT_SECRET');
    if (!userPortalTokenUrl || !userPortalClientSecret || !userPortalProfileUrl) {
      console.error('❌ Missing User Portal configuration');
      return new Response(JSON.stringify({
        error: 'User Portal configuration is missing',
        details: 'Please configure USER_PORTAL_TOKEN_URL, USER_PORTAL_PROFILE_URL and USER_PORTAL_CLIENT_SECRET'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('🔄 Step 1: Exchanging authorization code for access token...');
    // ---------------------------------------------------
    // 1) Exchange CODE → ACCESS TOKEN from User Portal
    // ---------------------------------------------------
    const formData = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: userPortalClientId,
      client_secret: userPortalClientSecret,
      redirect_uri: redirectUri || `${req.headers.get('origin') || ''}/auth/callback`
    });
    const tokenRes = await fetch("https://test-user-portal.scgjwd.com/api-user-portal/api/auth/token", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    });
    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error('❌ Token exchange failed:', tokenRes.status, errorText);
      return new Response(JSON.stringify({
        error: 'Failed to exchange authorization code',
        details: errorText,
        status: tokenRes.status
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error('❌ No access token in response:', tokenData);
      return new Response(JSON.stringify({
        error: 'Invalid token response',
        details: 'Access token not found in response'
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Step 1 complete: Got access token');
    // ---------------------------------------------------
    // 2) Get user profile from User Portal
    // ---------------------------------------------------
    console.log('🔄 Step 2: Fetching user profile from User Portal...');
    const profileRes = await fetch("https://test-user-portal.scgjwd.com/api-user-portal/api/user/getprofile", {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    if (!profileRes.ok) {
      const profileError = await profileRes.text();
      console.error('❌ Failed to fetch profile:', profileRes.status, profileError);
      return new Response(JSON.stringify({
        error: 'Failed to fetch user profile from User Portal',
        details: profileError || profileRes.statusText
      }), {
        status: 502,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const profile = await profileRes.json();
    console.log('✅ Step 2 complete: Got user profile');
    console.log('profile data:', profile);
    const email = profile.data?.email;
    if (!email) {
      console.error('❌ Profile response missing email field');
      return new Response(JSON.stringify({
        error: 'Profile response missing email field',
        details: 'User Portal profile payload must contain at least an email property'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const fullName = profile.fullName || profile.full_name || profile.name || profile.displayName;
    const department = profile.department || profile.Department || profile.dept;
    const employeeId = profile.employeeId || profile.employee_id || profile.staffId;
    const role = mapDepartmentToRole(department);
    const metadata = {
      fullName,
      department,
      employeeId,
      role,
      ...profile
    };
    // ---------------------------------------------------
    // 3) Find or create user in Supabase
    // ---------------------------------------------------
    console.log('🔄 Step 3: Finding or creating user in Supabase...');
    const existingUser = await getUserByEmail(supabaseUrl, supabaseServiceRoleKey, email);
    let userId;
    if (existingUser) {
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        email,
        user_metadata: metadata
      });
      if (updateError) {
        console.warn('⚠️ Failed to update user metadata:', updateError);
      }
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: metadata
      });
      if (createError || !newUser?.user) {
        console.error('❌ Failed to create user:', createError);
        return new Response(JSON.stringify({
          error: 'Failed to create user',
          details: createError?.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      userId = newUser.user.id;
    }
    // ---------------------------------------------------
    // 4) Create session for the user
    // ---------------------------------------------------
    console.log('🔄 Step 4: Generating OTP for Supabase session...');
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectUri || `${Deno.env.get('PUBLIC_SITE_URL') ?? 'https://your-app.com'}/auth/callback`
      }
    });
    if (linkError || !linkData?.properties?.email_otp) {
      console.error('❌ Failed to generate OTP:', linkError);
      return new Response(JSON.stringify({
        error: 'Failed to generate OTP',
        details: linkError?.message ?? 'missing email_otp'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const otp = linkData.properties.email_otp;
    // ใช้ anon หรือ service role key ก็ได้ แต่ต้องสร้าง client ใหม่
    const anonOrServiceKey = Deno.env.get('SUPABASE_ANON_KEY') ?? supabaseServiceRoleKey;
    const authClient = createClient(supabaseUrl, anonOrServiceKey);
    const { data: sessionData, error: verifyError } = await authClient.auth.verifyOtp({
      email,
      token: otp,
      type: 'magiclink'
    });
    if (verifyError || !sessionData?.session) {
      console.error('❌ Failed to verify OTP:', verifyError);
      return new Response(JSON.stringify({
        error: 'Failed to verify OTP',
        details: verifyError?.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Step 4 complete: Session created');
    return new Response(JSON.stringify({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      token_type: 'Bearer',
      user: sessionData.user,
      metadata
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error in user-portal-login:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
