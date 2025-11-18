/**
 * Integration tests for /api/admin/web-settings route
 */

import { GET, POST } from '@/app/api/admin/web-settings/route';
import { createMockRequest, expectJsonResponse } from '../../utils/api-test-helpers';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('/api/admin/web-settings', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'web_settings') {
          return {
            select: jest.fn(),
            upsert: jest.fn(),
          };
        }
        if (table === 'profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(),
              })),
            })),
          };
        }
        return {};
      }),
      auth: {
        getUser: jest.fn(),
      },
    };

    mockCreateClient.mockReturnValue(mockSupabase as any);

    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  describe('GET /api/admin/web-settings', () => {
    it('should successfully return all web settings', async () => {
      const mockSettings = [
        { setting_key: 'site_name', setting_value: 'Test Site' },
        { setting_key: 'contact_email', setting_value: 'test@example.com' },
        { setting_key: 'max_cards_per_user', setting_value: '10' },
        { setting_key: 'home_slider', setting_value: '[{"title":"Slide 1"}]' },
      ];

      mockSupabase.from('web_settings').select.mockResolvedValue({
        data: mockSettings,
        error: null,
      });

      const request = createMockRequest('GET');
      const response = await GET(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(json.settings).toBeDefined();
      expect(json.settings.site_name).toBe('Test Site');
      expect(json.settings.contact_email).toBe('test@example.com');
      expect(json.settings.max_cards_per_user).toBe(10); // Should be converted to number
      expect(Array.isArray(json.settings.home_slider)).toBe(true); // Should be parsed as JSON
    });

    it('should handle database errors', async () => {
      mockSupabase.from('web_settings').select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createMockRequest('GET');
      const response = await GET(request);
      const json = await expectJsonResponse(response, 500);

      expect(json.error).toContain('Failed to fetch settings');
    });

    it('should parse JSON fields correctly', async () => {
      const mockSettings = [
        { setting_key: 'features_items', setting_value: '[{"title":"Feature 1"}]' },
        { setting_key: 'home_slider', setting_value: '[{"id":1,"title":"Slide"}]' },
      ];

      mockSupabase.from('web_settings').select.mockResolvedValue({
        data: mockSettings,
        error: null,
      });

      const request = createMockRequest('GET');
      const response = await GET(request);
      const json = await expectJsonResponse(response, 200);

      expect(Array.isArray(json.settings.features_items)).toBe(true);
      expect(Array.isArray(json.settings.home_slider)).toBe(true);
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockSettings = [
        { setting_key: 'home_slider', setting_value: 'invalid-json{' },
      ];

      mockSupabase.from('web_settings').select.mockResolvedValue({
        data: mockSettings,
        error: null,
      });

      const request = createMockRequest('GET');
      const response = await GET(request);
      const json = await expectJsonResponse(response, 200);

      // Should still return success, but with unparsed value
      expect(json.success).toBe(true);
    });
  });

  describe('POST /api/admin/web-settings', () => {
    const mockAdminUser = {
      id: 'admin-user-id',
      email: 'admin@example.com',
    };

    const mockAdminProfile = {
      id: 'admin-user-id',
      user_type: 'admin',
    };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockAdminProfile,
          error: null,
        }),
      });
    });

    it('should successfully save web settings as admin', async () => {
      const mockSettings = {
        site_name: 'Updated Site',
        contact_email: 'new@example.com',
        max_cards_per_user: 20,
      };

      mockSupabase.from('web_settings').upsert.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('POST', { settings: mockSettings }, {
        authorization: 'Bearer valid-admin-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      expect(json.message).toContain('saved successfully');
      expect(mockSupabase.from('web_settings').upsert).toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', async () => {
      const request = createMockRequest('POST', {
        settings: { site_name: 'Test' },
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 401);

      expect(json.error).toContain('Missing or invalid authorization header');
    });

    it('should return 401 when token is invalid', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = createMockRequest('POST', {
        settings: { site_name: 'Test' },
      }, {
        authorization: 'Bearer invalid-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 401);

      expect(json.error).toContain('Unauthorized');
    });

    it('should return 403 when user is not admin or owner', async () => {
      const mockRegularUser = {
        id: 'regular-user-id',
        email: 'user@example.com',
      };

      const mockRegularProfile = {
        id: 'regular-user-id',
        user_type: 'user',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockRegularUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockRegularProfile,
          error: null,
        }),
      });

      const request = createMockRequest('POST', {
        settings: { site_name: 'Test' },
      }, {
        authorization: 'Bearer regular-user-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 403);

      expect(json.error).toContain('Insufficient permissions');
    });

    it('should allow owner to save settings', async () => {
      const mockOwnerUser = {
        id: 'owner-user-id',
        email: 'owner@example.com',
      };

      const mockOwnerProfile = {
        id: 'owner-user-id',
        user_type: 'owner',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockOwnerUser },
        error: null,
      });

      mockSupabase.from('profiles').select().eq.mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockOwnerProfile,
          error: null,
        }),
      });

      mockSupabase.from('web_settings').upsert.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('POST', {
        settings: { site_name: 'Owner Site' },
      }, {
        authorization: 'Bearer owner-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
    });

    it('should return 400 when settings data is invalid', async () => {
      const request = createMockRequest('POST', {
        // Missing settings object
      }, {
        authorization: 'Bearer valid-admin-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 400);

      expect(json.error).toContain('Invalid settings data');
    });

    it('should handle JSON fields correctly', async () => {
      const mockSettings = {
        site_name: 'Test',
        features_items: [{ title: 'Feature 1' }],
        home_slider: [{ id: 1, title: 'Slide' }],
      };

      mockSupabase.from('web_settings').upsert.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = createMockRequest('POST', { settings: mockSettings }, {
        authorization: 'Bearer valid-admin-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 200);

      expect(json.success).toBe(true);
      // Verify that JSON fields were stringified
      const upsertCall = mockSupabase.from('web_settings').upsert.mock.calls[0][0];
      const featuresItem = upsertCall.find((item: any) => item.setting_key === 'features_items');
      expect(typeof featuresItem.setting_value).toBe('string');
    });

    it('should handle database upsert errors', async () => {
      mockSupabase.from('web_settings').upsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createMockRequest('POST', {
        settings: { site_name: 'Test' },
      }, {
        authorization: 'Bearer valid-admin-token',
      });

      const response = await POST(request);
      const json = await expectJsonResponse(response, 500);

      expect(json.error).toContain('Failed to save settings');
    });
  });
});

