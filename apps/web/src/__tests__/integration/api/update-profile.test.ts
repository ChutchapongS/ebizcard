/**
 * Integration tests for /api/update-profile route
 */

import { POST } from '@/app/api/update-profile/route';
import { createMockRequest, expectJsonResponse } from '../../utils/api-test-helpers';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/update-profile', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                data: null,
                error: null,
              })),
            })),
          };
        }
        return {};
      }),
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  describe('POST /api/update-profile', () => {
    it('should successfully update profile with valid data', async () => {
      const request = createMockRequest('POST', {
        userId: 'user-123',
        updates: {
          full_name: 'Updated Name',
          personal_phone: '1234567890',
          company: 'Test Company',
        },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(mockSupabase.from('profiles').update).toHaveBeenCalled();
    });

    it('should return 400 when userId is missing', async () => {
      const request = createMockRequest('POST', {
        updates: {
          full_name: 'Updated Name',
        },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 400);

      expect(json.error).toContain('Missing userId');
    });

    it('should return 400 when updates is missing', async () => {
      const request = createMockRequest('POST', {
        userId: 'user-123',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 400);

      expect(json.error).toContain('Invalid updates');
    });

    it('should return 400 when payload is too large', async () => {
      // Create a large payload (>15KB)
      const largeAddresses = Array(1000).fill({
        type: 'home',
        address: 'Very long address string that exceeds the limit',
        province: 'Bangkok',
        country: 'Thailand',
      });

      const request = createMockRequest('POST', {
        userId: 'user-123',
        updates: {
          addresses: largeAddresses,
        },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 400);

      expect(json.error).toContain('Payload too large');
    });

    it('should exclude avatar_url and profile_image from metadata updates', async () => {
      const request = createMockRequest('POST', {
        userId: 'user-123',
        updates: {
          full_name: 'Updated Name',
          avatar_url: 'data:image/png;base64,very-long-base64-string',
          profile_image: 'data:image/png;base64,another-long-string',
        },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      // Verify that avatar_url and profile_image are excluded from metadata
      const updateCall = mockSupabase.from('profiles').update.mock.calls[0][0];
      expect(updateCall.avatar_url).toBeUndefined();
      expect(updateCall.profile_image).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from('profiles').update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const request = createMockRequest('POST', {
        userId: 'user-123',
        updates: {
          full_name: 'Updated Name',
        },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 500);

      expect(json.error).toBeDefined();
    });

    it('should handle OPTIONS preflight request', async () => {
      const request = createMockRequest('OPTIONS', {});

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return 500 when service role key is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const request = createMockRequest('POST', {
        userId: 'user-123',
        updates: {
          full_name: 'Updated Name',
        },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 500);

      expect(json.error).toContain('Service role key not configured');
    });
  });
});

