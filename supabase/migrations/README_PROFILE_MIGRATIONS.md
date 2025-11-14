# Profile Fields Migrations

This document describes the migrations that add comprehensive profile fields to support the Settings page functionality.

## Migration Files

### 004_add_profile_fields.sql
**Purpose**: Add all profile fields and address management functionality

**Key Changes**:
- Adds profile fields to `profiles` table:
  - `profile_image` - User profile picture URL
  - `personal_phone` - Personal phone number
  - `company_logo` - Company logo URL
  - `company` - Company name
  - `department` - Department/division
  - `job_title` - Job title/position
  - `work_phone` - Work phone number
  - `work_email` - Work email address
  - `website` - Company/personal website
  - `facebook` - Facebook profile URL
  - `line_id` - LINE ID
  - `linkedin` - LinkedIn profile URL
  - `twitter` - Twitter profile URL
  - `instagram` - Instagram profile URL

- Creates `addresses` table for multiple addresses per user:
  - Supports multiple addresses (home, work, other)
  - Primary address designation
  - Full address fields (address, district, province, postal code, country)

- Adds triggers and functions:
  - Auto-sync profile data from user metadata
  - Ensure only one primary address per user
  - Update timestamps automatically

### 005_update_user_registration.sql
**Purpose**: Update user registration to handle new profile fields

**Key Changes**:
- Updates `handle_new_user()` function to include all new profile fields
- Migrates existing user metadata to profile fields
- Ensures new users get all profile fields populated

### 006_add_performance_indexes.sql
**Purpose**: Add performance optimizations and utility functions

**Key Changes**:
- Adds indexes for common query patterns
- Creates full-text search functionality for profiles
- Adds utility functions for statistics and cleanup
- Adds documentation comments

## Database Schema

### Profiles Table (Updated)
```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Personal Information
    profile_image TEXT,
    personal_phone TEXT,
    
    -- Work Information  
    company_logo TEXT,
    company TEXT,
    department TEXT,
    job_title TEXT,
    work_phone TEXT,
    work_email TEXT,
    website TEXT,
    
    -- Social Media
    facebook TEXT,
    line_id TEXT,
    linkedin TEXT,
    twitter TEXT,
    instagram TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Addresses Table (New)
```sql
CREATE TABLE public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'other')),
    address TEXT NOT NULL,
    district TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Thailand',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Key Features

### 1. Automatic Data Sync
- Profile data automatically syncs from Supabase Auth user metadata
- Address data syncs from user metadata JSON array
- Real-time updates when user metadata changes

### 2. Address Management
- Multiple addresses per user
- Address types: home, work, other
- Primary address designation (only one per user)
- Automatic cleanup of orphaned data

### 3. Search and Discovery
- Full-text search across profile fields
- Search function: `public.search_profiles(query)`
- Profile statistics: `public.get_profile_stats()`

### 4. Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own profile data
- Secure functions with SECURITY DEFINER

## Usage Examples

### Get Complete User Profile
```sql
SELECT * FROM public.user_profiles_complete WHERE id = $1;
```

### Search Users
```sql
SELECT * FROM public.search_profiles('software engineer');
```

### Get Profile Statistics
```sql
SELECT * FROM public.get_profile_stats();
```

### Get User Addresses
```sql
SELECT * FROM public.addresses WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC;
```

## Migration Order

Run these migrations in order:
1. `004_add_profile_fields.sql`
2. `005_update_user_registration.sql` 
3. `006_add_performance_indexes.sql`

## Notes

- All existing user data will be preserved
- New users will automatically get all profile fields
- Existing users will have their metadata migrated to profile fields
- The system is backward compatible with existing code
- All functions are properly secured with RLS policies
