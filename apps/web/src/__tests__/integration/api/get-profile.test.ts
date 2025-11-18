/**
 * Integration tests for /api/get-profile route
 */

import { POST } from '@/app/api/get-profile/route';
import { createMockRequest, expectJsonResponse } from '../../utils/api-test-helpers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn((name: string) => ({
      value: name === 'access-token' ? 'mock-token' : undefined,
    })),
    set: jest.fn(),
  })),
}));

// Mock Supabase SSR
jest.mock('@supabase/ssr');
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>;

describe('/api/get-profile', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(),
              })),
            })),
          };
        }
        if (table === 'addresses') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(),
              })),
            })),
          };
        }
        return {};
      }),
    };

    mockCreateServerClient.mockReturnValue(mockSupabase as any);

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  describe('POST /api/get-profile', () => {
    it('should successfully return user profile with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
      };

      const mockAddresses = [
        {
          type: 'home',
          address: '123 Test St',
          province: 'Bangkok',
          country: 'Thailand',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      mockSupabase.from('addresses').select().eq.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockAddresses,
          error: null,
        }),
      });

      const request = createMockRequest('POST', {
        access_token: 'valid-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(json.profile).toBeDefined();
      expect(json.profile.id).toBe('user-123');
    });

    it('should return 401 when access token is missing', async () => {
      const request = createMockRequest('POST', {});

      const response = await POST(request);
      const json = await expectJsonResponse(response, 401);

      expect(json.error).toContain('No access token provided');
    });

    it('should return 401 when token is invalid', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = createMockRequest('POST', {
        access_token: 'invalid-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 401);

      expect(json.error).toContain('Unauthorized');
    });

    it('should handle missing profile gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' },
        }),
      });

      const request = createMockRequest('POST', {
        access_token: 'valid-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 500);

      expect(json.error).toContain('Failed to fetch profile');
    });

    it('should handle missing addresses gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        addresses: [],
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      mockSupabase.from('addresses').select().eq.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Table not found' },
        }),
      });

      const request = createMockRequest('POST', {
        access_token: 'valid-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(json.profile.addresses).toEqual([]);
    });

    it('should parse addresses from profile if addresses table is empty', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockProfile = {
        id: 'user-123',
        full_name: 'Test User',
        addresses: JSON.stringify([
          {
            type: 'work',
            address: '456 Work St',
            province: 'Bangkok',
          },
        ]),
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      });

      mockSupabase.from('addresses').select().eq.mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const request = createMockRequest('POST', {
        access_token: 'valid-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(Array.isArray(json.profile.addresses)).toBe(true);
      expect(json.profile.addresses.length).toBeGreaterThan(0);
    });
  });
});

