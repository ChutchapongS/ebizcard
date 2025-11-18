import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { rateLimit, RATE_LIMIT_CONFIGS, addRateLimitHeaders } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Resend (will use API key from environment variable)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// POST - Send contact form email
export async function POST(request: NextRequest) {
  // Apply rate limiting (strict for contact form to prevent spam)
  const rateLimitResponse = rateLimit(request, RATE_LIMIT_CONFIGS.strict);
  if (rateLimitResponse) return rateLimitResponse;
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Get contact email from web_settings
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: settingsData, error: settingsError } = await supabase
      .from('web_settings')
      .select('setting_value')
      .eq('setting_key', 'contact_email')
      .single();

    if (settingsError || !settingsData) {
      console.error('❌ Error fetching contact email:', settingsError);
      return NextResponse.json(
        { success: false, error: 'ไม่สามารถดึงข้อมูลอีเมลติดต่อได้' },
        { status: 500 }
      );
    }

    const contactEmail = settingsData.setting_value || 'hello@ebizcard.com';

    // Create email content
    const emailSubject = `[ติดต่อเรา] ${subject}`;
    const emailBody = `
คุณได้รับข้อความใหม่จากแบบฟอร์มติดต่อเรา

ชื่อ-นามสกุล: ${name}
อีเมล: ${email}
หัวข้อ: ${subject}

ข้อความ:
${message}

---
ข้อความนี้ถูกส่งจากแบบฟอร์มติดต่อเราบนเว็บไซต์ e-BizCard
    `.trim();

    // Send email using mailto link (works without external service)
    // In production, you can integrate with:
    // - Resend (https://resend.com) - Recommended
    // - SendGrid
    // - Nodemailer with SMTP
    // - Supabase Edge Function with email service

    // For now, we'll store the contact form submission in a table
    // and return success. The admin can check these submissions.
    // You can also integrate with email service later.
    
    // Store contact form submission in database (optional)
    try {
      const { error: insertError } = await supabase
        .from('contact_submissions')
        .insert({
          name,
          email,
          subject,
          message,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.warn('⚠️ Could not save to database (table may not exist):', insertError);
        // Continue anyway - this is optional
      }
    } catch (dbError) {
      console.warn('⚠️ Database error (table may not exist):', dbError);
      // Continue anyway - this is optional
    }

    // Send email using Resend
    let emailSent = false;
    let emailError: string | Error | null = null;

    if (resend && process.env.RESEND_API_KEY) {
      try {
        // Get the from email from environment
        // IMPORTANT: You MUST use a verified email address
        // Check your verified domains at: https://resend.com/domains
        // If you don't have a verified domain, you need to:
        // 1. Go to https://resend.com/domains
        // 2. Add and verify your domain
        // 3. Use an email from that domain (e.g., noreply@yourdomain.com)
        const fromEmail = process.env.RESEND_FROM_EMAIL;
        
        if (!fromEmail) {
          const errorMsg = 'RESEND_FROM_EMAIL not configured. Please verify a domain and set RESEND_FROM_EMAIL in .env.local';
          emailError = errorMsg;
          throw new Error(errorMsg);
        }
        
        const emailResult = await resend.emails.send({
          from: fromEmail,
          to: contactEmail,
          subject: emailSubject,
          replyTo: email,
          text: emailBody,
          html: `
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
          `,
        });

        if (emailResult.data && emailResult.data.id) {
          emailSent = true;
        } else {
          emailError = emailResult.error ? String(emailResult.error) : 'Unknown error';
          console.error('❌ Email send failed:', emailResult.error);
        }
      } catch (error) {
        emailError = error instanceof Error ? error : String(error);
        console.error('❌ Error sending email:', error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        // Check if it's a domain verification error
        if (error instanceof Error && error.message.includes('not verified')) {
          emailError = error.message + ' - Please verify your domain at https://resend.com/domains or use onboarding@resend.dev for testing';
        }
      }
    } else {
      emailError = 'RESEND_API_KEY not configured';
      console.warn('⚠️ Resend API key not configured. Email not sent.');
      console.warn('⚠️ To enable email sending, set RESEND_API_KEY in your environment variables.');
      console.warn('⚠️ Get your API key from: https://resend.com/api-keys');
    }

    // Return response with email status
    let response: NextResponse;
    if (emailSent) {
      response = NextResponse.json({
        success: true,
        message: 'ส่งข้อความสำเร็จ อีเมลถูกส่งแล้ว',
        emailSent: true,
      });
    } else {
      // Still return success for form submission, but indicate email wasn't sent
      response = NextResponse.json({
        success: true,
        message: 'ส่งข้อความสำเร็จ (ข้อมูลถูกบันทึกแล้ว แต่ไม่สามารถส่งอีเมลได้)',
        emailSent: false,
        emailError: emailError instanceof Error ? emailError.message : (emailError || 'Email service not configured'),
      });
    }
    return addRateLimitHeaders(response, request);

  } catch (error) {
    console.error('❌ Error processing contact form:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งข้อความ' 
      },
      { status: 500 }
    );
  }
}

