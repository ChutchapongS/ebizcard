# Rate Limiting Documentation

## Overview

Rate limiting has been implemented to prevent abuse and DDoS attacks on API routes. The system uses in-memory LRU cache to track request counts per IP address.

## Configuration

Rate limit configurations are defined in `apps/web/src/lib/rate-limit.ts`:

- **strict**: 5 requests per minute (for authentication, contact forms)
- **standard**: 30 requests per minute (for regular API calls)
- **relaxed**: 100 requests per minute (for public endpoints)
- **public**: 200 requests per minute (for read-only public endpoints)

## Usage

### Basic Usage

```typescript
import { rateLimit, RATE_LIMIT_CONFIGS, addRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(request, RATE_LIMIT_CONFIGS.strict);
  if (rateLimitResponse) return rateLimitResponse;
  
  // Your API logic here
  
  // Add rate limit headers to response
  const response = NextResponse.json({ success: true });
  return addRateLimitHeaders(response, request);
}
```

## API Routes with Rate Limiting

### Strict (5 req/min)
- `/api/contact` - Contact form (prevents spam)

### Standard (30 req/min)
- `/api/generate-qr` - QR code generation
- _(เดิม)_ `/api/update-profile`, `/api/get-profile` → ย้ายไป Supabase Edge Functions แล้ว (จัดการ rate limit ที่ layer ใหม่)

### Relaxed (100 req/min)
- `/api/card-views` - Card view tracking

## Response Headers

When rate limited, the response includes:
- `Retry-After`: Seconds until the rate limit resets
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when limit resets

## Error Response

When rate limit is exceeded, returns:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again in X seconds.",
  "retryAfter": 45
}
```
Status code: `429 Too Many Requests`

## Implementation Details

- Uses LRU cache with max 500 entries
- Cache entries expire after 2 minutes
- Tracks requests by IP address (or IP + user ID if authenticated)
- Supports X-Forwarded-For and X-Real-IP headers for proxy/load balancer scenarios

## Future Improvements

For production at scale, consider:
- Redis-based rate limiting for distributed systems
- Per-user rate limiting using authenticated user IDs
- Different limits for different user tiers
- Rate limiting middleware for Next.js middleware.ts

