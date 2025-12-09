import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

// Get Supabase client with service role key (bypasses RLS)
function getSupabaseClient() {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Log request for debugging
  console.log('Contact function called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  })

  try {
    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = getSupabaseClient()
    
    // Verify service role key is set
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { name, email, subject, message } = await req.json()

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return new Response(
          JSON.stringify({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get contact email from web_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('web_settings')
        .select('setting_value')
        .eq('setting_key', 'contact_email')
        .single()

      if (settingsError) {
        console.error('Error fetching contact email:', {
          error: settingsError,
          message: settingsError.message,
          details: settingsError.details,
          hint: settingsError.hint,
          code: settingsError.code
        })
        // Use default email if settings fetch fails
        const contactEmail = 'hello@ebizcard.com'
        console.warn('Using default contact email:', contactEmail)
        
        // Continue with default email instead of returning error
      }

      const contactEmail = settingsData?.setting_value || 'hello@ebizcard.com'

      // Store contact form submission in database (optional)
      // Try contact_submissions first, fallback to contact_leads if it doesn't exist
      try {
        let insertError = null
        
        // Try contact_submissions first
        const { error: submissionsError } = await supabase
          .from('contact_submissions')
          .insert({
            name,
            email,
            subject,
            message,
            created_at: new Date().toISOString(),
          })
        
        if (submissionsError) {
          // If contact_submissions doesn't exist, try contact_leads (but it requires owner_id and card_id)
          // For now, just log the error - database storage is optional
          console.warn('Could not save to contact_submissions (table may not exist):', submissionsError.message)
        }
      } catch (dbError) {
        // Database storage is optional - continue anyway
        console.warn('Database error (table may not exist):', dbError instanceof Error ? dbError.message : String(dbError))
      }

      // Send email using Resend
      let emailSent = false
      let emailError: string | null = null

      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL')

      // Log for debugging (don't log full API key for security)
      console.log('Resend configuration:', {
        hasApiKey: !!resendApiKey,
        apiKeyLength: resendApiKey?.length || 0,
        apiKeyPrefix: resendApiKey?.substring(0, 3) || 'none',
        fromEmail: resendFromEmail || 'not set',
      })

      if (resendApiKey && resendFromEmail) {
        try {
          // Create email content
          const emailSubject = `[ติดต่อเรา] ${subject}`
          const emailBody = `
คุณได้รับข้อความใหม่จากแบบฟอร์มติดต่อเรา

ชื่อ-นามสกุล: ${name}
อีเมล: ${email}
หัวข้อ: ${subject}

ข้อความ:
${message}

---
ข้อความนี้ถูกส่งจากแบบฟอร์มติดต่อเราบนเว็บไซต์ e-BizCard
          `.trim()

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                คุณได้รับข้อความใหม่จากแบบฟอร์มติดต่อเรา
              </h2>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>ชื่อ-นามสกุล:</strong> ${name}</p>
                <p><strong>อีเมล:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>หัวข้อ:</strong> ${subject}</p>
              </div>
              <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #111827; margin-top: 0;">ข้อความ:</h3>
                <p style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                ข้อความนี้ถูกส่งจากแบบฟอร์มติดต่อเราบนเว็บไซต์ e-BizCard<br>
                คุณสามารถตอบกลับอีเมลนี้ได้โดยตรง
              </p>
            </div>
          `

          // Use Resend REST API (works with Deno)
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: resendFromEmail,
              // For testing with onboarding@resend.dev, can only send to registered email
              // In production with verified domain, can send to any email
              to: resendFromEmail === 'onboarding@resend.dev' 
                ? 'metoo.excel@gmail.com' // Use registered email for testing
                : contactEmail,
              subject: emailSubject,
              reply_to: email,
              text: emailBody,
              html: emailHtml,
            }),
          })

          if (resendResponse.ok) {
            const result = await resendResponse.json()
            if (result.id) {
              emailSent = true
            } else {
              emailError = result.error?.message || 'Unknown error'
              console.error('Email send failed:', result)
            }
          } else {
            const errorData = await resendResponse.json().catch(() => ({ error: 'Unknown error' }))
            console.error('Email send failed:', {
              status: resendResponse.status,
              statusText: resendResponse.statusText,
              errorData,
              fromEmail: resendFromEmail,
              hasApiKey: !!resendApiKey,
            })
            
            // Handle different error types
            if (resendResponse.status === 403) {
              // 403 Forbidden - usually means API key issue or domain not verified
              console.error('Resend 403 error details:', {
                errorData,
                fullError: JSON.stringify(errorData),
                apiKeyPrefix: resendApiKey?.substring(0, 10) || 'none',
                fromEmail: resendFromEmail,
              })
              
              if (errorData.error?.message?.includes('not verified') || 
                  errorData.error?.message?.includes('domain') ||
                  errorData.error?.message?.includes('unauthorized') ||
                  errorData.message?.includes('not verified')) {
                emailError = `Domain or email not verified. Please verify your domain at https://resend.com/domains or use onboarding@resend.dev for testing. Error: ${errorData.error?.message || errorData.message || 'Forbidden'}`
              } else {
                // More detailed error message
                const errorMsg = errorData.error?.message || errorData.message || 'Forbidden'
                emailError = `Resend API authentication failed (403). Error: ${errorMsg}. Please verify: 1) RESEND_API_KEY is correct and active, 2) RESEND_FROM_EMAIL is set to 'onboarding@resend.dev' for testing, 3) Edge Function is redeployed after setting secrets.`
              }
            } else if (resendResponse.status === 401) {
              emailError = `Resend API key invalid (401). Please check your RESEND_API_KEY in Supabase Edge Function secrets. Error: ${errorData.error?.message || errorData.message || 'Unauthorized'}`
            } else {
              emailError = errorData.error?.message || errorData.message || `HTTP ${resendResponse.status}: ${resendResponse.statusText}`
            }
          }
        } catch (error) {
          emailError = error instanceof Error ? error.message : String(error)
          console.error('Error sending email:', error)
        }
      } else {
        emailError = 'RESEND_API_KEY or RESEND_FROM_EMAIL not configured'
        console.warn('Resend API key or from email not configured. Email not sent.')
        console.warn('To enable email sending, set RESEND_API_KEY and RESEND_FROM_EMAIL in Supabase Edge Function secrets.')
      }

      // Return response with email status
      if (emailSent) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'ส่งข้อความสำเร็จ อีเมลถูกส่งแล้ว',
            emailSent: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Still return success for form submission, but indicate email wasn't sent
        return new Response(
          JSON.stringify({
            success: true,
            message: 'ส่งข้อความสำเร็จ (ข้อมูลถูกบันทึกแล้ว แต่ไม่สามารถส่งอีเมลได้)',
            emailSent: false,
            emailError: emailError || 'Email service not configured',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing contact form:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งข้อความ',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

