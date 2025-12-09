/**
 * API Client for Supabase Edge Functions
 * 
 * This client replaces the Next.js API routes with Supabase Edge Functions
 * for static export compatibility.
 */

const getFunctionsUrl = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  }
  return `${supabaseUrl}/functions/v1`
}

/**
 * Get the API endpoint URL
 * @param endpoint - The API endpoint path (e.g., 'get-profile')
 * @returns Full URL to the Edge Function
 */
export const getApiUrl = (endpoint: string): string => {
  const functionsUrl = getFunctionsUrl()
  return `${functionsUrl}/${endpoint}`
}

/**
 * Get access token from Supabase session
 * This function should be called from client-side only
 */
async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  try {
    // Import Supabase client dynamically to avoid SSR issues
    const { supabase } = await import('@/lib/supabase/client')
    if (!supabase) {
      return null
    }
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

/**
 * Make authenticated API request to Edge Function
 * @param endpoint - The API endpoint path
 * @param options - Fetch options
 * @returns Promise with response data
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint)
  
  // Get access token from Supabase session
  const accessToken = await getAccessToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Add authorization header if token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  try {
    console.log(`[API Client] Calling ${endpoint} at ${url}`)
    
    const response = await fetch(url, {
      ...options,
      headers,
    })

    console.log(`[API Client] Response status: ${response.status} for ${endpoint}`)

    if (!response.ok) {
      let errorData: any
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : { error: 'Unknown error' }
      } catch {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
      }
      
      const errorMessage = errorData.error || errorData.details || `API request failed: ${response.statusText}`
      const error: Error & { status?: number; data?: any } = new Error(errorMessage)
      error.status = response.status
      error.data = errorData
      
      console.error(`[API Client] API request failed for ${endpoint}:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage: errorData.error,
        errorDetails: errorData.details,
        hasAccessToken: !!accessToken,
      })
      throw error
    }

    const result = await response.json()
    console.log(`[API Client] Success for ${endpoint}`)
    return result
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const errorDetails = {
        url,
        endpoint,
        message: 'Failed to fetch - Edge Function may not be deployed or CORS issue',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAccessToken: !!accessToken,
      }
      console.error(`[API Client] Network error for ${endpoint}:`, errorDetails)
      
      const networkError: Error & { status?: number; data?: any } = new Error(
        `Failed to connect to Edge Function: ${endpoint}. Please ensure the function is deployed at ${url}`
      )
      networkError.status = 0
      networkError.data = { 
        error: 'Network error',
        ...errorDetails,
        troubleshooting: 'Please check: 1) Edge Function is deployed, 2) NEXT_PUBLIC_SUPABASE_URL is correct, 3) CORS is configured'
      }
      throw networkError
    }
    
    // Re-throw other errors with logging
    console.error(`[API Client] Error for ${endpoint}:`, {
      error,
      url,
      endpoint,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Call get-profile API
 */
export async function getProfile() {
  return apiRequest<{ success: boolean; profile: any }>('get-profile', {
    method: 'POST',
  })
}

/**
 * Call update-profile API
 */
export async function updateProfile(updates: Record<string, any>, userId?: string) {
  let targetUserId = userId

  if (!targetUserId) {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        targetUserId = session?.user?.id ?? undefined
      }
    } catch (error) {
      console.error('Error getting user ID for updateProfile:', error)
    }
  }

  if (!targetUserId) {
    throw new Error('User ID is required to update profile')
  }

  return apiRequest<{ success: boolean; error: null }>('update-profile', {
    method: 'POST',
    body: JSON.stringify({
      userId: targetUserId,
      updates,
    }),
  })
}

/**
 * Call sync-user-metadata API
 */
export async function syncUserMetadata(userId: string) {
  return apiRequest<{ success: boolean; message: string; data?: any }>('sync-user-metadata', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

/**
 * Call generate-vcard API
 */
export async function generateVCard(cardId: string) {
  const url = getApiUrl('generate-vcard')
  
  // Get access token from Supabase session
  const accessToken = await getAccessToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add authorization header if token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cardId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to generate vCard: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  // Return blob for vCard download
  return response.blob()
}

/**
 * Get addresses for a user
 */
export async function getAddresses(userId?: string) {
  const url = getApiUrl('addresses')
  
  // Get access token from Supabase session
  const accessToken = await getAccessToken()
  
  const headers: Record<string, string> = {}
  
  // Add authorization header if token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  // Add userId to query params if provided
  const queryParams = userId ? `?userId=${encodeURIComponent(userId)}` : ''
  
  const response = await fetch(`${url}${queryParams}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to fetch addresses: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Save a single address (upsert by type)
 */
export async function saveAddress(address: any) {
  return apiRequest<{ id: string; message: string }>('addresses', {
    method: 'POST',
    body: JSON.stringify({ address }),
  })
}

/**
 * Update all addresses for a user (replace strategy)
 */
export async function updateAddresses(addresses: any[], userId?: string) {
  let targetUserId = userId

  if (!targetUserId) {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        targetUserId = session?.user?.id ?? undefined
      }
    } catch (error) {
      console.error('Error getting user ID for updateAddresses:', error)
    }
  }

  if (!targetUserId) {
    throw new Error('User ID is required to update addresses')
  }

  return apiRequest<{ success: boolean; message: string; data?: any[] }>('addresses', {
    method: 'POST',
    body: JSON.stringify({
      userId: targetUserId,
      addresses,
    }),
  })
}

/**
 * Record a card view (analytics)
 */
export async function recordCardView(cardId: string, cardName?: string | null, deviceInfo?: string) {
  return apiRequest<{ success: boolean }>('card-views', {
    method: 'POST',
    body: JSON.stringify({
      cardId,
      cardName: cardName || null,
      deviceInfo: deviceInfo || `${navigator.userAgent || 'unknown'} - ${navigator.platform || 'unknown'}`,
    }),
  })
}

/**
 * Generate QR code for a business card
 */
export async function generateQRCode(cardId: string) {
  return apiRequest<{
    success: boolean
    qrCode: string
    publicUrl: string
    card: {
      id: string
      name: string | null
      job_title: string | null
      company: string | null
    }
  }>('generate-qr', {
    method: 'POST',
    body: JSON.stringify({ cardId }),
  })
}

/**
 * Send contact form message
 */
export async function sendContactMessage(data: {
  name: string
  email: string
  subject: string
  message: string
}) {
  // Contact form is public, but Edge Functions require apikey and Authorization headers
  const url = getApiUrl('contact')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!supabaseAnonKey) {
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
    throw new Error('Supabase configuration error: ANON_KEY is missing')
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'x-client-info': 'eBizCard-web@1.0.0',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    let errorData: any = { error: 'Unknown error' }
    try {
      const errorText = await response.text()
      if (errorText) {
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
        }
      }
    } catch (e) {
      console.warn('Failed to read error response:', e)
    }
    
    console.error('Contact form error:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      url,
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey.length,
    })
    
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || errorData.details || `Failed to send contact message: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json() as Promise<{
    success: boolean
    message: string
    emailSent?: boolean
    emailError?: string
  }>
}

/**
 * Upload logo (supports both logo and company-logo)
 */
export async function uploadLogo(file: File, type: 'logo' | 'company' = 'logo') {
  const url = getApiUrl('upload-logo')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const formData = new FormData()
  if (type === 'company') {
    formData.append('company_logo', file)
  } else {
    formData.append('logo', file)
  }
  formData.append('type', type)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to upload logo: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json() as Promise<{
    success: boolean
    url: string
    imageUrl?: string
    filename: string
    bucket: string
    size: number
  }>
}

/**
 * Delete user account
 */
export async function deleteAccount() {
  return apiRequest<{
    success: boolean
    message: string
  }>('delete-account', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

/**
 * Export paper card (PDF, PNG, or SVG)
 */
export async function exportPaperCard(data: {
  cardId: string
  template: string
  settings: any
  format: 'pdf' | 'png' | 'svg'
}) {
  const url = getApiUrl('export-paper-card')
  const accessToken = await getAccessToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to export paper card: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  // Return blob for file download
  return response.blob()
}

/**
 * Upload profile image
 */
export async function uploadProfile(file: File) {
  const url = getApiUrl('upload-profile')
  
  // Get access token from Supabase session
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const formData = new FormData()
  formData.append('profile', file)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to upload profile: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Get templates
 */
export async function getTemplates() {
  return apiRequest<{ templates: any[] }>('templates', {
    method: 'GET',
  })
}

/**
 * Get template by ID
 */
export async function getTemplate(id: string) {
  const url = getApiUrl('templates')
  const accessToken = await getAccessToken()
  
  const headers: Record<string, string> = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to fetch template: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Create template
 */
export async function createTemplate(templateData: {
  name: string
  paper: any
  elements: any
  user_id?: string
  preview_image?: string
  user_type?: string
}) {
  return apiRequest<{ data: any }>('templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  })
}

/**
 * Update template
 */
export async function updateTemplate(id: string, templateData: {
  name: string
  paper: any
  elements: any
  preview_image?: string
}) {
  const url = getApiUrl('templates')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const response = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData),
  })

  if (!response.ok) {
    let errorData: any = { error: 'Unknown error' }
    let errorText = ''
    try {
      errorText = await response.text()
      if (errorText) {
        try {
          errorData = JSON.parse(errorText)
        } catch (parseError) {
          // If not JSON, use text as error message
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
        }
      } else {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
      }
    } catch (e) {
      console.warn('Failed to read error response:', e)
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    console.error('Update template error:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      errorText: errorText.substring(0, 500), // Limit text length
      url: `${url}?id=${encodeURIComponent(id)}`,
      templateData: {
        hasName: !!templateData.name,
        nameLength: templateData.name?.length || 0,
        hasPaper: !!templateData.paper,
        hasElements: !!templateData.elements,
        elementsCount: Array.isArray(templateData.elements) ? templateData.elements.length : 0,
        hasPreview: !!templateData.preview_image,
        previewLength: templateData.preview_image?.length || 0
      }
    })
    
    const errorMessage = errorData.error || errorData.details || errorData.message || `Failed to update template: ${response.statusText}`
    const error: Error & { status?: number; data?: any } = new Error(errorMessage)
    error.status = response.status
    error.data = {
      ...errorData,
      hint: errorData.hint,
      code: errorData.code,
      fullError: errorText.substring(0, 1000) // Include full error text for debugging
    }
    throw error
  }

  return response.json()
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string) {
  const url = getApiUrl('templates')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const response = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to delete template: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Record template usage
 */
export async function recordTemplateUsage(templateId: string, cardId: string) {
  const url = getApiUrl('templates')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const response = await fetch(`${url}?action=usage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template_id: templateId, card_id: cardId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to record template usage: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Get template usage statistics
 */
export async function getTemplateUsage() {
  return apiRequest<{ usage: Record<string, number> }>('templates', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Get web settings (public, no auth required)
 */
export async function getWebSettings() {
  // Use apiRequest but without auth requirement
  const url = getApiUrl('web-settings')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to fetch web settings: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json() as Promise<{ success: boolean; settings: any }>
}

/**
 * Save web settings (admin only)
 */
export async function saveWebSettings(settings: any) {
  return apiRequest<{ success: boolean; message: string }>('web-settings', {
    method: 'POST',
    body: JSON.stringify({ settings }),
  })
}

/**
 * Get level capabilities (public, no auth required)
 */
export async function getLevelCapabilities() {
  const url = getApiUrl('level-capabilities')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to fetch level capabilities: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json() as Promise<{ success: boolean; capabilities: any }>
}

/**
 * Save level capabilities (admin only)
 */
export async function saveLevelCapabilities(capabilities: any) {
  return apiRequest<{ success: boolean; message: string }>('level-capabilities', {
    method: 'POST',
    body: JSON.stringify({ capabilities }),
  })
}

/**
 * Get menu visibility settings (public, no auth required)
 */
export async function getMenuVisibility() {
  const url = getApiUrl('menu-visibility')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to fetch menu visibility: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json() as Promise<{ success: boolean; settings: any }>
}

/**
 * Save menu visibility settings (admin only)
 */
export async function saveMenuVisibility(settings: any) {
  return apiRequest<{ success: boolean; message: string }>('menu-visibility', {
    method: 'POST',
    body: JSON.stringify({ settings }),
  })
}

/**
 * Get all users (admin only, GET)
 */
export async function getUsers() {
  return apiRequest<{ users: any[] }>('update-user-type', {
    method: 'GET',
  })
}

/**
 * Update user type (admin only, POST)
 */
export async function updateUserType(targetUserId: string, newRole: string, newPlan?: string, reason?: string) {
  return apiRequest<{ success: boolean; message: string }>('update-user-type', {
    method: 'POST',
    body: JSON.stringify({ targetUserId, newRole, newPlan, reason }),
  })
}

/**
 * Upload website logo (admin only)
 */
export async function uploadWebsiteLogo(file: File) {
  const url = getApiUrl('upload-website-logo')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const formData = new FormData()
  formData.append('logo', file)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to upload website logo: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Upload slide image (admin only)
 */
export async function uploadSlideImage(file: File, slideId: string) {
  const url = getApiUrl('upload-slide-image')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const formData = new FormData()
  formData.append('slide_image', file)
  formData.append('slide_id', slideId)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to upload slide image: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

/**
 * Upload feature icon (admin only)
 */
export async function uploadFeatureIcon(file: File, featureId?: string) {
  const url = getApiUrl('upload-feature-icon')
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    throw new Error('No access token available. Please sign in.')
  }

  const formData = new FormData()
  formData.append('icon', file)
  if (featureId) {
    formData.append('featureId', featureId)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    const error: Error & { status?: number; data?: any } = new Error(
      errorData.error || `Failed to upload feature icon: ${response.statusText}`
    )
    error.status = response.status
    error.data = errorData
    throw error
  }

  return response.json()
}

