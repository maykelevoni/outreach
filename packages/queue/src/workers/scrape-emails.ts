import { Worker, Job } from 'bullmq'
import { redisConnection, QUEUE_NAMES } from '../config'
import { ScrapeEmailsJobData } from '../queues'
import { scrapeEmailsFromWebsite, findBestEmail } from 'scraper'
import { db, leads } from 'database'
import { eq } from 'drizzle-orm'

export const scrapeEmailsWorker = new Worker<ScrapeEmailsJobData>(
  QUEUE_NAMES.SCRAPE_EMAILS,
  async (job: Job<ScrapeEmailsJobData>) => {
    const { leadId, website } = job.data

    console.log(`📧 Starting email scraping for lead: ${leadId}`)
    console.log(`🌐 Website: ${website}`)

    try {
      // Scrape website for emails
      const results = await scrapeEmailsFromWebsite({
        website,
        timeout: 30000,
        headless: true,
      })

      await job.updateProgress(50)

      if (results.length === 0) {
        console.log(`⚠️ No emails found for ${website}`)
        return { success: false, reason: 'no_emails_found' }
      }

      // Collect all found emails
      const allEmails = results.flatMap((r) => r.emails)
      console.log(`✅ Found ${allEmails.length} potential emails`)

      // Find best email (validates and scores)
      const bestEmail = await findBestEmail(allEmails)

      await job.updateProgress(80)

      if (!bestEmail) {
        console.log(`⚠️ No valid emails after validation`)
        return { success: false, reason: 'validation_failed' }
      }

      console.log(`✅ Best email: ${bestEmail}`)

      // Update lead with email
      await db
        .update(leads)
        .set({
          email: bestEmail,
          status: 'email_found',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      await job.updateProgress(100)

      return {
        success: true,
        email: bestEmail,
        totalFound: allEmails.length,
      }
    } catch (error) {
      console.error(`❌ Email scraping failed for lead ${leadId}:`, error)
      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 3, // Max 3 email scraping jobs at once
    limiter: {
      max: 20, // Max 20 jobs
      duration: 60000, // Per minute
    },
  }
)

scrapeEmailsWorker.on('completed', (job) => {
  console.log(`✅ Email scraping job ${job.id} completed`)
})

scrapeEmailsWorker.on('failed', (job, error) => {
  console.error(`❌ Email scraping job ${job?.id} failed:`, error.message)
})

scrapeEmailsWorker.on('error', (error) => {
  console.error('⚠️ Email scraping worker error:', error)
})
