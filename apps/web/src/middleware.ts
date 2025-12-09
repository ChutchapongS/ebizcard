import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware is not supported in static export mode
  // CORS headers must be configured at hosting level (S3/CloudFront) for static export
  const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true'
  
  if (isStaticExport) {
    // Return response without modification for static export
    // CORS will be handled by hosting provider (S3/CloudFront)
    return NextResponse.next()
  }
  
  // Normal mode: Add CORS headers to all responses
  const response = NextResponse.next()
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}