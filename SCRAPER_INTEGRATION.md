# Google Maps Scraper Integration

This project integrates [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper), an open-source Google Maps scraping tool that extracts business data including emails.

## What Changed

### ✅ Added Components

1. **Docker Service** - `google-maps-scraper` service in `docker-compose.yml`
2. **API Client** - `packages/scraper/src/maps/gosom-client.ts` - TypeScript wrapper for the Gosom API
3. **Updated Worker** - Modified `packages/queue/src/workers/scrape-maps.ts` to use Gosom instead of Playwright

### 🔄 Migration Benefits

**Before (Custom Playwright Scraper):**
- ❌ Browser-based scraping (resource-intensive)
- ❌ No built-in email extraction
- ❌ Complex anti-detection needed
- ❌ Manual scrolling and pagination

**After (Gosom Scraper):**
- ✅ Battle-tested open-source solution
- ✅ **Automatic email extraction from websites**
- ✅ More efficient (no browser needed)
- ✅ Built-in rate limiting and retry logic
- ✅ REST API with job queue
- ✅ Exports to JSON, CSV, or PostgreSQL

## How It Works

```
Campaign Created
    ↓
BullMQ Queue Worker (scrape-maps.ts)
    ↓
Gosom API Client (gosom-client.ts)
    ↓
Gosom Docker Container (port 8080)
    ↓
Scrapes Google Maps + Visits Websites
    ↓
Returns: name, address, phone, website, EMAIL, rating, reviews
    ↓
Saves to Database (leads table)
```

## Setup & Usage

### 1. Start Services

```bash
# Start Redis and Google Maps Scraper
docker compose up -d

# Verify services are running
docker compose ps
```

### 2. Check Scraper Health

```bash
# Health check
curl http://localhost:8080/health

# API docs (Swagger UI)
open http://localhost:8080/api/docs
```

### 3. Run a Scraping Job

**Via UI:**
1. Go to Campaigns → New Campaign
2. Enter keyword (e.g., "restaurants") and location (e.g., "New York, NY")
3. Click "Start Scraping"
4. Watch the progress in real-time

**Via tRPC:**
```typescript
const result = await trpc.campaigns.startScraping.mutate(campaignId)
```

**Directly via Gosom API:**
```bash
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "query": "coffee shops San Francisco",
    "max_results": 50,
    "extract_emails": true
  }'
```

### 4. Monitor Progress

The worker automatically:
1. Creates a job in Gosom scraper
2. Polls for completion every 5 seconds
3. Downloads results when done
4. Saves leads to database
5. Updates campaign status

## Data Flow

### Scraped Data Fields

```typescript
{
  name: string                    // Business name
  address?: string               // Full address
  phone?: string                // Phone number
  website?: string              // Website URL
  email?: string                // ✨ EMAIL (extracted from website)
  rating?: number               // Google rating
  reviews_count?: number        // Number of reviews
  category?: string             // Business category
  latitude?: number            // GPS coordinates
  longitude?: number           // GPS coordinates
  place_id?: string           // Google Place ID
  cid?: string               // Customer ID
  maps_url?: string         // Google Maps URL
}
```

### Database Mapping

Gosom data is mapped to your `leads` table:
- `name` → `businessName`
- `email` → `email` (NEW! Previously had to be scraped separately)
- `reviews_count` → `reviewCount`
- `category` → `categories` (as array)
- Status automatically set to `email_found` if email exists

## Configuration

### Environment Variables

```bash
# .env
GOSOM_API_URL=http://localhost:8080
```

### Docker Compose Options

```yaml
google-maps-scraper:
  command: [
    '-data-folder', '/gmapsdata',
    '-email',                      # Enable email extraction
    # Optional flags:
    # '-max-depth', '2',           # How deep to crawl websites
    # '-concurrency', '5',         # Concurrent scraping jobs
  ]
```

## Fallback Strategy

The integration keeps your existing email scraping worker as a fallback:

1. **Primary:** Gosom extracts emails during Maps scraping
2. **Fallback:** If no email found, queue `scrape-emails` job to try again

This ensures maximum email discovery rate.

## API Client Usage

### Basic Usage

```typescript
import { scrapeWithGosom } from 'scraper'

const results = await scrapeWithGosom({
  keyword: 'dentists',
  location: 'Austin, TX',
  maxResults: 100,
  extractEmails: true,
})

console.log(`Found ${results.length} businesses`)
console.log(`With emails: ${results.filter(r => r.email).length}`)
```

### Advanced Usage

```typescript
import { GosomScraperClient } from 'scraper'

const client = new GosomScraperClient('http://localhost:8080')

// Check if service is healthy
const isHealthy = await client.healthCheck()

// Create job
const job = await client.createJob({
  keyword: 'gyms',
  location: 'Miami, FL',
  maxResults: 50,
})

// Monitor progress
const status = await client.getJobStatus(job.id)
console.log(`Job status: ${status.status}`)

// Get results when ready
const results = await client.waitForJob(job.id)

// Or download as CSV
const csv = await client.downloadCSV(job.id)
```

## Troubleshooting

### Scraper not responding

```bash
# Check if container is running
docker compose ps

# View logs
docker compose logs google-maps-scraper

# Restart service
docker compose restart google-maps-scraper
```

### Jobs timing out

Increase timeout in `gosom-client.ts`:
```typescript
await client.waitForJob(job.id, 5000, 600000) // 10 minutes
```

### No emails found

1. Check that `-email` flag is set in docker-compose.yml
2. Verify businesses have websites
3. Some websites may block email extraction

## Performance

**Speed:**
- ~50 businesses in 2-3 minutes (with email extraction)
- Faster without email extraction (~1 minute)

**Resource Usage:**
- Low CPU (no browser needed)
- ~200MB RAM
- Minimal network bandwidth

## Next Steps

### Optional Enhancements

1. **Direct PostgreSQL Integration**
   - Configure Gosom to write directly to your database
   - Skip the API client layer for better performance

2. **Webhook Notifications**
   - Get notified when scraping completes
   - Reduce polling overhead

3. **Custom Scrapers**
   - Fork Gosom and customize extraction logic
   - Add support for additional data points

4. **Caching Layer**
   - Cache results to avoid re-scraping
   - Save API calls and improve speed

## References

- [Gosom Scraper GitHub](https://github.com/gosom/google-maps-scraper)
- [Gosom API Documentation](http://localhost:8080/api/docs)
- [Scrapemate Framework](https://github.com/gosom/scrapemate)
