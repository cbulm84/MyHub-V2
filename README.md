# Employee Portal

A Next.js-based employee management system with Supabase backend.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom brand colors
- **Backend**: Supabase (PostgreSQL, Authentication)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- Git for version control

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd employee-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

5. Run database migrations in Supabase:
   - Go to your Supabase project SQL editor
   - Run the migration file from `/migrations/001_initial_schema.sql`

6. Start the development server:
```bash
npm run dev
```

## Project Structure

```
/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and configurations
│   └── supabase/    # Supabase client setup
├── types/           # TypeScript type definitions
├── hooks/           # Custom React hooks
├── utils/           # Helper functions
├── docs/            # Documentation
├── assets/          # Static assets
│   ├── logos/       # Company logos
│   └── fonts/       # Custom fonts
├── migrations/      # Database migrations
└── public/          # Public static files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Features Roadmap

- [ ] User authentication (email/password)
- [ ] Employee CRUD operations
- [ ] Location management
- [ ] Search and filtering
- [ ] Export functionality
- [ ] Role-based permissions
- [ ] SSO integration (future)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Private - Internal use only