# Supabase Edge Functions

This directory contains Supabase Edge Functions that replace Next.js API routes for static export compatibility.

## Structure

```
supabase/functions/
├── _shared/           # Shared utilities
│   ├── auth.ts       # Authentication helpers
│   └── cors.ts       # CORS headers
├── get-profile/       # Get user profile
└── [other-functions]/ # Other API endpoints
```

## Migration from Next.js API Routes

### Before (Next.js API Route)
```typescript
// apps/web/src/app/api/get-profile/route.ts
export async function POST(request: NextRequest) {
  // ... implementation
}
```

### After (Supabase Edge Function)
```typescript
// apps/web/supabase/functions/get-profile/index.ts
serve(async (req) => {
  // ... implementation
})
```

## Client Usage

### Before
```typescript
const response = await fetch('/api/get-profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: token })
})
```

### After
```typescript
import { getProfile } from '@/lib/api-client'

const { success, profile } = await getProfile()
```

## Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy get-profile

# Deploy with environment variables
supabase functions deploy get-profile --env-file .env.local
```

## Environment Variables

Edge Functions automatically have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key (if needed)

## Migration Checklist

- [x] Create shared auth helper (`_shared/auth.ts`)
- [x] Create shared CORS helper (`_shared/cors.ts`)
- [x] Migrate `get-profile` API route
- [x] Migrate `update-profile` API route
- [ ] Migrate `update-addresses` API route
- [ ] Migrate `upload-profile` API route
- [ ] Migrate `generate-vcard` API route
- [ ] Migrate `generate-qr` API route
- [ ] Migrate `card-views` API route
- [ ] Migrate `contact` API route
- [ ] Migrate admin API routes
- [ ] Update all client code to use `api-client.ts`
- [ ] Test all migrated endpoints
- [ ] Remove old API routes from `apps/web/src/app/api/`

