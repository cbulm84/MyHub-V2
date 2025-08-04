# Supabase Local Development

This directory contains your Supabase project configuration, migrations, and functions.

## Setup Instructions

1. **Link to your remote project**:
   ```bash
   npx supabase login
   npx supabase link --project-ref ieiuhdxdziszeabilnxp
   ```

2. **Pull remote schema** (if you already have tables in production):
   ```bash
   npx supabase db pull
   ```

3. **Start local Supabase**:
   ```bash
   npx supabase start
   ```

4. **Run migrations locally**:
   ```bash
   npx supabase db reset
   ```

## Directory Structure

- `/migrations` - Database schema migrations
- `/functions` - Edge functions (similar to Lovable.dev)
- `/seeds` - Seed data for development
- `config.toml` - Local Supabase configuration

## Common Commands

- `npx supabase start` - Start local Supabase
- `npx supabase stop` - Stop local Supabase
- `npx supabase db reset` - Reset local database
- `npx supabase db push` - Push local migrations to remote
- `npx supabase functions serve` - Run edge functions locally
- `npx supabase gen types typescript --local > ../types/database.ts` - Generate TypeScript types

## Edge Functions

To create a new edge function:
```bash
npx supabase functions new my-function
```

This creates a similar structure to Lovable.dev's functions folder.