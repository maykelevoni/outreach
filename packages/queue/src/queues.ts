import { Queue } from 'bullmq'
import { redisConnection, QUEUE_NAMES } from './config'

// Define job data types
export interface ScrapeMapsJobData {
  campaignId: string
  keyword: string
  location: string
  maxResults?: number
}

export interface ScrapeEmailsJobData {
  leadId: string
  website: string
}

export interface SendEmailsJobData {
  emailId: string
  leadId: string
  campaignId: string
  templateId: string
}

// Create queues
export const scrapeMapsQueue = new Queue<ScrapeMapsJobData>(
  QUEUE_NAMES.SCRAPE_MAPS,
  {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600, // Keep for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep for 7 days
      },
    },
  }
)

export const scrapeEmailsQueue = new Queue<ScrapeEmailsJobData>(
  QUEUE_NAMES.SCRAPE_EMAILS,
  {
    connection: redisConnection,
  }
)

export const sendEmailsQueue = new Queue<SendEmailsJobData>(
  QUEUE_NAMES.SEND_EMAILS,
  {
    connection: redisConnection,
  }
)

// Helper functions to add jobs
export async function queueMapsScrapingJob(data: ScrapeMapsJobData) {
  return await scrapeMapsQueue.add('scrape-google-maps', data, {
    jobId: `campaign-${data.campaignId}`,
  })
}

export async function queueEmailScrapingJob(data: ScrapeEmailsJobData) {
  return await scrapeEmailsQueue.add('scrape-email', data, {
    jobId: `lead-${data.leadId}`,
  })
}

export async function queueSendEmailJob(data: SendEmailsJobData) {
  return await sendEmailsQueue.add('send-email', data)
}
