import { ConnectionOptions } from 'bullmq'

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
}

export const QUEUE_NAMES = {
  SCRAPE_MAPS: 'scrape-maps',
  SCRAPE_EMAILS: 'scrape-emails',
  SEND_EMAILS: 'send-emails',
} as const
