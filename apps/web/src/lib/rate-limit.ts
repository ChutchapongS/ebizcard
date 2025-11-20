/**
 * Rate Limiting Utility
 * 
 * Provides rate limiting functionality to prevent abuse and DDoS attacks.
 * Uses in-memory storage (LRU cache) to track request counts per IP address.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

// Rate limit configuration
export interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

// Default rate limit configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for authentication and sensitive operations
  strict: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 requests per minute
  },
  // Standard limits for regular API calls
  standard: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  },
  // Relaxed limits for public endpoints
  relaxed: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute
  },
  // Very relaxed for read-only public endpoints
  public: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 200, // 200 requests per minute
  },
} as const;

// Create LRU cache for storing rate limit data
// Max 500 entries, entries expire after 2 minutes
const tokenCache = new LRUCache<string, number[]>({
  max: 500,
  ttl: 2 * 60 * 1000, // 2 minutes
});

/**
 * Get client identifier from request
 * 
 * @param {NextRequest} request - The incoming request
 * @returns {string} Client identifier (IP address or user ID)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  // Optionally include user ID if authenticated
  // This allows per-user rate limiting
  const userId = request.headers.get('x-user-id');
  
  return userId ? `${ip}-${userId}` : ip;
}

/**
 * Check if request exceeds rate limit
 * 
 * @param {string} identifier - Client identifier
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {boolean} True if rate limit is exceeded
 */
function isRateLimited(
  identifier: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const windowStart = now - config.interval;

  // Get existing timestamps for this identifier
  const timestamps = tokenCache.get(identifier) || [];

  // Filter out timestamps outside the current window
  const validTimestamps = timestamps.filter(
    (timestamp: number) => timestamp > windowStart
  );

  // Check if limit is exceeded
  if (validTimestamps.length >= config.uniqueTokenPerInterval) {
    return true;
  }

  // Add current timestamp
  validTimestamps.push(now);
  tokenCache.set(identifier, validTimestamps);

  return false;
}

/**
 * Rate limit middleware for Next.js API routes
 * 
 * @param {NextRequest} request - The incoming request
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {NextResponse | null} Error response if rate limited, null if allowed
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = rateLimit(request, RATE_LIMIT_CONFIGS.strict);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   
 *   // Your API logic here
 * }
 * ```
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.standard
): NextResponse | null {
  const identifier = getClientIdentifier(request);
  const limited = isRateLimited(identifier, config);

  if (limited) {
    const remainingTime = Math.ceil(
      (config.interval - (Date.now() - (tokenCache.get(identifier)?.[0] || Date.now()))) / 1000
    );

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime,
      },
      {
        status: 429,
        headers: {
          'Retry-After': remainingTime.toString(),
          'X-RateLimit-Limit': config.uniqueTokenPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + remainingTime * 1000).toISOString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const timestamps = tokenCache.get(identifier) || [];
  const remaining = Math.max(0, config.uniqueTokenPerInterval - timestamps.length);

  // Store headers in request for later use
  (request as any).rateLimitHeaders = {
    'X-RateLimit-Limit': config.uniqueTokenPerInterval.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
  };

  return null;
}

/**
 * Helper function to add rate limit headers to response
 * 
 * @param {NextResponse} response - The response object
 * @param {NextRequest} request - The request object
 * @returns {NextResponse} Response with rate limit headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const headers = (request as any).rateLimitHeaders;
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });
  }
  return response;
}

