# Email Outreach Automation System

An automated email outreach system that helps you find and contact businesses from Google Maps.

## Features

- 🗺️ **Google Maps Scraping** - Find businesses by keyword and location
- 📧 **Email Discovery** - Automatically find contact emails from websites
- ✉️ **Personalized Templates** - Create dynamic email templates with variables
- 📊 **Email Tracking** - Track opens, clicks, and replies
- 🚀 **Smart Sending** - Warm-up schedules and anti-spam measures
- 📈 **Analytics Dashboard** - Campaign performance metrics and insights

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: Neon (Serverless PostgreSQL) with Drizzle ORM
- **Queue System**: Redis + BullMQ for background jobs
- **Scraping**: Playwright (browser automation)
- **Email Service**: Resend API
- **Template Engine**: Handlebars
- **UI**: React + shadcn/ui + Tailwind CSS
- **API Layer**: tRPC for type-safe APIs

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker Desktop (for Redis)
- Neon account (for database)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd outreach
```

2. Install dependencies:
```bash
pnpm install
```

3. Setup environment variables:
```bash
cp .env.example .env
```

4. Create a Neon database:
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string to `.env`

5. Start Redis:
```bash
docker-compose up -d
```

6. Run database migrations:
```bash
pnpm db:migrate
```

7. Start the development server:
```bash
pnpm dev
```

8. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
outreach/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App router pages
│       ├── components/         # React components
│       └── lib/                # Utilities and configs
├── packages/
│   ├── database/               # Database schema & migrations
│   ├── scraper/                # Google Maps + website scraping
│   ├── email/                  # Email sending & templates
│   └── queue/                  # BullMQ workers
└── docker-compose.yml          # Redis container
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linting
- `pnpm type-check` - Run TypeScript type checking
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

## Development Roadmap

- [x] Phase 1: Foundation (Infrastructure & Database)
- [ ] Phase 2: Google Maps Scraping
- [ ] Phase 3: Email Discovery
- [ ] Phase 4: Email Templates
- [ ] Phase 5: Email Sending
- [ ] Phase 6: Email Tracking
- [ ] Phase 7: Analytics Dashboard
- [ ] Phase 8: Polish & Deploy

## License

MIT
