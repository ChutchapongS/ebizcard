/** @type {import('next').NextConfig} */
const envVars = {
  CUSTOM_KEY: process.env.CUSTOM_KEY || '',
};

const buildOutput = process.env.NEXT_BUILD_OUTPUT;
const enableStandalone = buildOutput === 'standalone';
const enableStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

// Helper function to extract hostname from URL
const getHostname = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const nextConfig = {
  // Enable static export when NEXT_STATIC_EXPORT=true
  ...(enableStaticExport ? { 
    output: 'export',
    distDir: 'out',  // ระบุ output directory อย่างชัดเจน
    // Exclude API routes from static export (they require server-side runtime)
    // API routes will be skipped during static export build
    pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js', 'tsx', 'ts', 'jsx', 'js'].filter(ext => {
      // Exclude API route files when doing static export
      return true; // We'll handle exclusion differently
    }),
  } : {}),
  
  // Images configuration - different for static export vs normal build
  images: enableStaticExport ? {
    // Static export requires unoptimized images
    
    unoptimized: true,
  } : {
    // Use remotePatterns instead of domains (Next.js 13+)
    remotePatterns: [
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [{
            protocol: 'https',
            hostname: getHostname(process.env.NEXT_PUBLIC_SUPABASE_URL),
          }].filter(p => p.hostname)
        : []),
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
    ].filter(Boolean),
  },
  
  // Standalone output only if not using static export
  ...(enableStandalone && !enableStaticExport ? { output: 'standalone' } : {}),
  trailingSlash: false,
  env: envVars,
  webpack: (config, { isServer, webpack }) => {
    // Prevent DOMPurify from being bundled on server-side
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'dompurify': false,
      };
    } else {
      // For client-side, use IgnorePlugin to prevent webpack from trying to resolve dompurify
      // It will be loaded dynamically at runtime
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^dompurify$/,
        })
      );
    }
    
    return config;
  },
  // Headers are not supported in static export - must be configured at hosting level (S3/CloudFront)
  ...(enableStaticExport ? {} : {
    async headers() {
      // Get allowed origins from environment or default to localhost for development
      const allowedOrigins = process.env.NEXT_PUBLIC_SITE_URL
        ? [process.env.NEXT_PUBLIC_SITE_URL]
        : process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:3000', 'http://localhost:3001'];
      
      // Security headers for all routes
      const securityHeaders = [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin'
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()'
        }
      ];

      return [
        // Security headers for all routes
        {
          source: '/:path*',
          headers: securityHeaders,
        },
        // CORS headers for API routes only
        {
          source: '/api/:path*',
          headers: [
            ...securityHeaders,
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            {
              key: 'Access-Control-Allow-Origin',
              value: allowedOrigins.length > 0 
                ? allowedOrigins.join(', ') 
                : process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
            },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
  }),
  // Redirects are not supported in static export - must be handled client-side or at hosting level
  ...(enableStaticExport ? {} : {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/dashboard',
          permanent: false,
          has: [
            {
              type: 'cookie',
              key: 'sb-access-token',
            },
          ],
        },
      ];
    },
  }),
};

module.exports = nextConfig;