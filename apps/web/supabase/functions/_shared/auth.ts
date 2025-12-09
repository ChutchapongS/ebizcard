import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Authenticate user from request
 * Returns user object if authenticated, null otherwise
 */
export async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  
  if (!authHeader) {
    return { user: null, error: 'Missing authorization header' }
  }

  const accessToken = authHeader.replace('Bearer ', '')
  
  if (!accessToken) {
    return { user: null, error: 'Invalid authorization header format' }
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken)
    
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid access token' }
    }

    return { user, error: null }
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    }
  }
}

/**
 * Get Supabase client with service role key
 */
export function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

