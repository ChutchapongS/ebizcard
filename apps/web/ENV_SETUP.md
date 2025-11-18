# Environment Variables Setup Guide

This guide explains how to configure environment variables for the eBizCard web application.

## Quick Start

1. Copy the example file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and fill in your values

3. Restart your development server:
   ```bash
   npm run dev
   ```

## Required Variables

### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Example**: `https://your-project-ref.supabase.co`
- **Where to find**: Supabase Dashboard → Settings → API → Project URL

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Your Supabase anonymous/public key
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### `NEXT_PUBLIC_SITE_URL`
- **Description**: Your application's public URL
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`
- **Used for**: CORS configuration, redirects, email links

### `NODE_ENV`
- **Description**: Node.js environment mode
- **Values**: `development` | `production` | `test`
- **Note**: Usually set automatically by Next.js, but can be overridden

## Optional Variables

### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key (for admin operations)
- **⚠️ Security**: Never expose this in client-side code!
- **Used for**: User deletion, admin operations
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`

### `RESEND_API_KEY`
- **Description**: Resend API key for sending emails
- **Used for**: Contact form email notifications
- **Where to get**: [Resend Dashboard](https://resend.com/api-keys)
- **Note**: If not set, contact form will save to database but won't send emails

### OAuth Providers

#### Google OAuth
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- **Setup**: [Google Cloud Console](https://console.cloud.google.com)

#### LinkedIn OAuth
- `LINKEDIN_CLIENT_ID`: LinkedIn OAuth Client ID
- `LINKEDIN_CLIENT_SECRET`: LinkedIn OAuth Client Secret
- **Setup**: [LinkedIn Developer Portal](https://www.linkedin.com/developers)

### Analytics & Monitoring

#### `NEXT_PUBLIC_GA_ID`
- **Description**: Google Analytics tracking ID
- **Format**: `G-XXXXXXXXXX` or `UA-XXXXXXXXX-X`

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Description**: Sentry DSN for error tracking
- **Where to get**: [Sentry Dashboard](https://sentry.io/settings/)

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production
```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use `.env.local`** for local development (already in `.gitignore`)
3. **Use platform environment variables** for production (Vercel, Netlify, etc.)
4. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** in client-side code
5. **Rotate keys regularly** if compromised

## Verification

To verify your environment variables are set correctly:

1. Check that required variables are present:
   ```bash
   # In Node.js/Next.js, these are available at build time
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   ```

2. Test Supabase connection:
   - Try logging in to the application
   - Check browser console for connection errors

3. Test email service (if configured):
   - Submit the contact form
   - Check Resend dashboard for sent emails

## Troubleshooting

### "Missing environment variable" errors
- Ensure `.env.local` exists in `apps/web/` directory
- Restart your development server after changing `.env.local`
- Check that variable names match exactly (case-sensitive)

### CORS errors
- Verify `NEXT_PUBLIC_SITE_URL` matches your actual domain
- Check `next.config.js` CORS configuration

### Email not sending
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for API key status
- Review server logs for error messages

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)

