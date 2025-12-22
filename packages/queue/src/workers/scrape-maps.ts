import { Worker, Job } from 'bullmq'
import { redisConnection, QUEUE_NAMES } from '../config'
import { ScrapeMapsJobData, queueEmailScrapingJob } from '../queues'
import { scrapeWithOutscraper } from 'scraper'
import { db, leads, campaigns } from 'database'
import { eq } from 'drizzle-orm'

export const scrapeMapsWorker = new Worker<ScrapeMapsJobData>(
  QUEUE_NAMES.SCRAPE_MAPS,
  async (job: Job<ScrapeMapsJobData>) => {
    const { campaignId, keyword, location, maxResults } = job.data

    console.log(`🚀 Starting scrape job for campaign: ${campaignId}`)

    try {
      // Update campaign status to scraping
      await db
        .update(campaigns)
        .set({ status: 'scraping', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId))

      // Report progress
      await job.updateProgress(10)

      // Get Outscraper API key from environment
      const apiKey = process.env.OUTSCRAPER_API_KEY
      if (!apiKey) {
        throw new Error('OUTSCRAPER_API_KEY environment variable is not set')
      }

      // Scrape Google Maps using Outscraper
      const businesses = await scrapeWithOutscraper({
        keyword,
        location,
        maxResults: maxResults || 100,
        apiKey,
      })

      await job.updateProgress(70)

      console.log(`✅ Scraped ${businesses.length} businesses`)

      // Save leads to database
      if (businesses.length > 0) {
        const leadsToInsert = businesses.map((business) => ({
          campaignId,
          businessName: business.name,
          address: business.address || null,
          phone: business.phone || null,
          website: business.website || null,
          email: business.email || null,
          rating: business.rating || null,
          reviewCount: business.reviews_count || null,
          categories: business.category ? [business.category] : [],
          mapsUrl: business.maps_url || null,
          status: (business.email ? 'email_found' : 'pending') as const,
          scrapedAt: new Date(),
        }))

        const insertedLeads = await db.insert(leads).values(leadsToInsert).returning()
        console.log(`💾 Saved ${leadsToInsert.length} leads to database`)

        // Count leads with emails already found
        const leadsWithEmail = insertedLeads.filter((lead) => lead.email).length
        console.log(`📧 ${leadsWithEmail} leads already have emails`)

        // Queue email scraping jobs only for leads without emails but with websites
        let emailJobsQueued = 0
        for (const lead of insertedLeads) {
          if (!lead.email && lead.website) {
            await queueEmailScrapingJob({
              leadId: lead.id,
              website: lead.website,
            })
            emailJobsQueued++
          }
        }

        if (emailJobsQueued > 0) {
          console.log(`🔍 Queued ${emailJobsQueued} additional email scraping jobs`)
        }
      }

      await job.updateProgress(90)

      // Update campaign status to ready
      await db
        .update(campaigns)
        .set({ status: 'ready', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId))

      await job.updateProgress(100)

      return {
        success: true,
        totalLeads: businesses.length,
        campaignId,
      }
    } catch (error) {
      console.error(`❌ Scraping failed for campaign ${campaignId}:`, error)

      // Update campaign status to draft on error
      await db
        .update(campaigns)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId))

      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 2, // Max 2 scraping jobs at once
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // Per minute
    },
  }
)

scrapeMapsWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`)
})

scrapeMapsWorker.on('failed', (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message)
})

scrapeMapsWorker.on('error', (error) => {
  console.error('⚠️ Worker error:', error)
})
