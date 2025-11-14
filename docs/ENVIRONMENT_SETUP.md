# Environment Setup Guide

This guide will help you set up the e-BizCard development environment.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase CLI** for database management
- **Expo CLI** for mobile development (optional)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eBizCard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   npm run setup:env
   ```

4. **Configure environment variables**
   - Edit `apps/web/.env.local`
   - Edit `apps/mobile/.env.local`

5. **Start development servers**
   ```bash
   # Start all apps
   npm run dev

   # Or start individually
   npm run dev:web
   npm run dev:mobile
   ```

## Environment Variables

### Web App (`apps/web/.env.local`)

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Mobile App (`apps/mobile/.env.local`)

```env
# Required
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SITE_URL=https://your-domain.com

# Optional
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
EXPO_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

## Supabase Setup

1. **Create a new Supabase project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose your organization and project name
   - Set a database password
   - Select a region (Singapore recommended for Thailand)

2. **Get your project credentials**
   - Go to Settings > API
   - Copy the Project URL and anon key
   - Update your environment variables

3. **Run database migrations**
   ```bash
   npm run supabase:start
   npm run supabase:reset
   ```

4. **Deploy Edge Functions**
   ```bash
   npm run supabase:deploy
   ```

## Development Commands

### Web App
```bash
# Development
npm run dev:web

# Build
npm run build:web

# Lint
npm run lint

# Type check
npm run type-check
```

### Mobile App
```bash
# Development
npm run dev:mobile

# Build
npm run build:mobile

# Build for specific platform
npm run build:android
npm run build:ios
```

### Database
```bash
# Start Supabase
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Reset database
npm run supabase:reset

# Deploy functions
npm run supabase:deploy
```

## Troubleshooting

### Common Issues

1. **Environment variables not loading**
   - Make sure `.env.local` files exist
   - Restart the development server
   - Check variable names (case-sensitive)

2. **Supabase connection errors**
   - Verify your project URL and API key
   - Check if your project is active
   - Ensure RLS policies are set up correctly

3. **Mobile app build errors**
   - Update Expo CLI: `npm install -g @expo/cli`
   - Clear cache: `npm run clean`
   - Check environment variables

4. **TypeScript errors**
   - Run type check: `npm run type-check`
   - Update types: `npm run type-check:watch`

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [Expo Documentation](https://docs.expo.dev)
- Read [Next.js Documentation](https://nextjs.org/docs)
- Open an issue in the GitHub repository

## Production Deployment

### Web App (Vercel)
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Mobile App (Expo)
1. Build for production: `npm run build:all`
2. Submit to app stores: `npm run submit:all`

### Database (Supabase)
1. Link to production project: `supabase link --project-ref your-project-ref`
2. Deploy migrations: `supabase db push`
3. Deploy functions: `supabase functions deploy`
