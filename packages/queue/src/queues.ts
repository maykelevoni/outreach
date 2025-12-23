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

// Lazy queue creation - only create when needed
let _scrapeMapsQueue: Queue<ScrapeMapsJobData> | null = null
let _scrapeEmailsQueue: Queue<ScrapeEmailsJobData> | null = null
let _sendEmailsQueue: Queue<SendEmailsJobData> | null = null

export const getScrapeMapsQueue = () => {
  if (!_scrapeMapsQueue) {
    _scrapeMapsQueue = new Queue<ScrapeMapsJobData>(
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
  }
  return _scrapeMapsQueue
}

export const getScrapeEmailsQueue = () => {
  if (!_scrapeEmailsQueue) {
    _scrapeEmailsQueue = new Queue<ScrapeEmailsJobData>(
      QUEUE_NAMES.SCRAPE_EMAILS,
      {
        connection: redisConnection,
      }
    )
  }
  return _scrapeEmailsQueue
}

export const getSendEmailsQueue = () => {
  if (!_sendEmailsQueue) {
    _sendEmailsQueue = new Queue<SendEmailsJobData>(
      QUEUE_NAMES.SEND_EMAILS,
      {
        connection: redisConnection,
      }
    )
  }
  return _sendEmailsQueue
}

// Helper functions to add jobs
export async function queueMapsScrapingJob(data: ScrapeMapsJobData) {
  const queue = getScrapeMapsQueue()
  return await queue.add('scrape-google-maps', data, {
    jobId: `campaign-${data.campaignId}`,
  })
}

export async function queueEmailScrapingJob(data: ScrapeEmailsJobData) {
  const queue = getScrapeEmailsQueue()
  return await queue.add('scrape-email', data, {
    jobId: `lead-${data.leadId}`,
  })
}

export async function queueSendEmailJob(data: SendEmailsJobData) {
  const queue = getSendEmailsQueue()
  return await queue.add('send-email', data)
}
