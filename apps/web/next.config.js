/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Extract domain from Supabase URL (remove https:// and path)
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/^https?:\/\//, '').split('/')[0]]
        : []),
      'lh3.googleusercontent.com',
      'media.licdn.com',
    ].filter(Boolean),
  },
  output: 'standalone',
  trailingSlash: false,
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
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
};

module.exports = nextConfig;