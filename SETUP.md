# Setup Guide

## Phase 1: Foundation - Initial Setup

Follow these steps to get your development environment running:

### 1. Install Dependencies

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 2. Setup Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Create a new database
4. Copy the connection string

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` and add your Neon database connection string:

```env
DATABASE_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Start Redis (Docker)

```bash
# Make sure Docker Desktop is running, then:
docker-compose up -d
```

### 5. Run Database Migrations

```bash
# Generate migration files
pnpm db:generate

# Apply migrations to Neon
pnpm db:migrate
```

### 6. Start Development Server

```bash
# Start the Next.js dev server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Troubleshooting

### Database Connection Issues

- Make sure your Neon connection string includes `?sslmode=require`
- Check that your IP is allowed in Neon's settings (they auto-allow all by default)

### Redis Connection Issues

- Ensure Docker Desktop is running
- Check Redis is running: `docker ps`
- Restart Redis: `docker-compose restart redis`

### Pnpm Workspace Issues

- Make sure you're using pnpm >= 8.0.0: `pnpm --version`
- If you get workspace errors, try: `pnpm install --force`

## Next Steps

After completing Phase 1 setup:

1. **Phase 2**: Implement Google Maps scraping
2. **Phase 3**: Build email discovery system
3. **Phase 4**: Create email templates
4. **Phase 5**: Setup email sending with Resend
5. **Phase 6**: Add email tracking
6. **Phase 7**: Build analytics dashboard
7. **Phase 8**: Deploy to production

See [README.md](README.md) for full project documentation.
