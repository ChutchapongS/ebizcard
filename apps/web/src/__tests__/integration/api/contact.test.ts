/**
 * Integration tests for /api/contact route
 */

import { POST } from '@/app/api/contact/route';
import { createMockRequest, createMockSupabaseClient, expectJsonResponse } from '../../utils/api-test-helpers';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Mock Resend
jest.mock('resend');
const mockResend = Resend as jest.MockedClass<typeof Resend>;

describe('/api/contact', () => {
  let mockSupabase: any;
  let mockResendInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = createMockSupabaseClient({
      web_settings: [
        {
          setting_key: 'contact_email',
          setting_value: 'admin@example.com',
        },
      ],
    });
    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Setup mock Resend
    mockResendInstance = {
      emails: {
        send: jest.fn(),
      },
    };
    mockResend.mockImplementation(() => mockResendInstance as any);

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.RESEND_FROM_EMAIL = 'noreply@test.com';
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  describe('POST /api/contact', () => {
    it('should successfully send contact form with valid data', async () => {
      const mockEmailSend = jest.fn().mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      });
      mockResendInstance.emails.send = mockEmailSend;

      const request = createMockRequest('POST', {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(json.emailSent).toBe(true);
      expect(mockEmailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('Test Subject'),
          replyTo: 'john@example.com',
        })
      );
    });

    it('should return error when required fields are missing', async () => {
      const request = createMockRequest('POST', {
        name: 'John Doe',
        // Missing email, subject, message
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 400);

      expect(json.success).toBe(false);
      expect(json.error).toContain('กรุณากรอกข้อมูลให้ครบถ้วน');
    });

    it('should return error for invalid email format', async () => {
      const request = createMockRequest('POST', {
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'Test message',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 400);

      expect(json.success).toBe(false);
      expect(json.error).toContain('รูปแบบอีเมลไม่ถูกต้อง');
    });

    it('should handle email service failure gracefully', async () => {
      const mockEmailSend = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Email service error' },
      });
      mockResendInstance.emails.send = mockEmailSend;

      const request = createMockRequest('POST', {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      // Should still return success but indicate email wasn't sent
      expect(json.success).toBe(true);
      expect(json.emailSent).toBe(false);
      expect(json.emailError).toBeDefined();
    });

    it('should work without Resend API key configured', async () => {
      delete process.env.RESEND_API_KEY;
      delete process.env.RESEND_FROM_EMAIL;

      const request = createMockRequest('POST', {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(json.emailSent).toBe(false);
      expect(json.emailError).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const mockEmailSend = jest.fn().mockResolvedValue({
        data: { id: 'email-id-123' },
        error: null,
      });
      mockResendInstance.emails.send = mockEmailSend;

      const request = createMockRequest('POST', {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });

      // Should still succeed even if database insert fails
      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
    });

    it('should handle missing contact email setting', async () => {
      // Mock missing contact email setting
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const request = createMockRequest('POST', {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 500);

      expect(json.success).toBe(false);
      expect(json.error).toContain('ไม่สามารถดึงข้อมูลอีเมลติดต่อได้');
    });
  });
});

