/**
 * Test utilities for API route testing
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init);
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient(mockData: any = {}) {
  const mockClient = {
    from: jest.fn((table: string) => ({
      select: jest.fn((columns?: string) => ({
        eq: jest.fn((column: string, value: any) => ({
          single: jest.fn(() => ({
            data: mockData[table]?.[0] || null,
            error: null,
          })),
          order: jest.fn((column: string, options?: { ascending: boolean }) => ({
            data: mockData[table] || [],
            error: null,
          })),
          data: mockData[table] || [],
          error: null,
        })),
        single: jest.fn(() => ({
          data: mockData[table]?.[0] || null,
          error: null,
        })),
        data: mockData[table] || [],
        error: null,
      })),
      insert: jest.fn((data: any) => ({
        data: { ...data, id: 'mock-id', created_at: new Date().toISOString() },
        error: null,
      })),
      update: jest.fn((data: any) => ({
        eq: jest.fn((column: string, value: any) => ({
          data: { ...data, id: value },
          error: null,
        })),
        data: { ...data },
        error: null,
      })),
      delete: jest.fn(() => ({
        eq: jest.fn((column: string, value: any) => ({
          data: null,
          error: null,
        })),
        data: null,
        error: null,
      })),
    })),
    auth: {
      getUser: jest.fn((token: string) => ({
        data: {
          user: mockData.user || {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      })),
      getSession: jest.fn(() => ({
        data: {
          session: {
            access_token: 'mock-token',
            user: mockData.user || {
              id: 'test-user-id',
              email: 'test@example.com',
            },
          },
        },
        error: null,
      })),
    },
  };

  return mockClient as any;
}

/**
 * Helper to extract JSON from NextResponse
 */
export async function getResponseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Helper to check response status and return JSON
 */
export async function expectJsonResponse(
  response: Response,
  expectedStatus: number
) {
  expect(response.status).toBe(expectedStatus);
  return getResponseJson(response);
}

