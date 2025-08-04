# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Alliance Mobile Employee Portal - a Next.js 15 application with Supabase backend for employee and location management.

## Tech Stack

- **Frontend**: Next.js 15.4.4, React 19, TypeScript 5.8
- **Styling**: Tailwind CSS with custom brand colors
- **Backend**: Supabase (PostgreSQL, Authentication via SSR)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel-ready configuration

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Run linting
npm run lint

# Run TypeScript type checking
npm run typecheck
```

### Windows PowerShell Scripts
- `clean-start.ps1` - Kill processes, clear caches, restart dev server
- `clear-cache.ps1` - Clear Next.js build artifacts
- `kill-server.ps1` - Kill Node/NPM processes
- `server-restart.ps1` - Restart development server

## Architecture

### Directory Structure
- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components with layouts
- `/contexts` - React contexts (AuthContext for authentication)
- `/lib/supabase` - Supabase client configuration (client.ts, server.ts, middleware.ts)
- `/types` - TypeScript type definitions (database.ts, supabase.ts)
- `/migrations` - SQL database migrations
- `/scripts` - Database seeding and utility scripts

### Key Patterns

1. **Authentication**: Uses Supabase Auth with SSR support via middleware
2. **Database Access**: Supabase client with TypeScript types from `@/types/supabase`
3. **Styling**: Tailwind CSS with Montserrat font (weights: 400, 600, 700, 900)
4. **Middleware**: Handles session updates for all routes except static assets

### Database Schema

The system uses a dual ID approach:
- `id` (UUID) - Internal primary keys
- `employee_id`/`location_id` (INTEGER) - Business identifiers

Core tables:
- `employees` - Employee records with location assignments
- `locations` - Physical locations/stores
- `addresses` - Centralized address storage
- `termination_reasons` - Employee termination catalog
- Organizational hierarchy: `markets` → `regions` → `districts` → `locations`

All tables include:
- Soft deletes via `is_active` flag
- Audit fields: `created_at`, `updated_at`
- Row Level Security policies

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Operations

1. **Migrations**: Apply via Supabase SQL editor from `/migrations/`
2. **Seeding**: Use scripts in `/scripts/` directory
3. **RLS Policies**: Currently allow authenticated users to read all data

## Important Notes

- Font Awesome 6.5.1 loaded via CDN in root layout
- All API routes in `/app/api/` directory
- Employee portal branded as "Alliance Hub"
- Windows-specific development environment (paths use backslashes)
- No test framework currently configured