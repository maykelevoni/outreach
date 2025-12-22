import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from root .env
dotenv.config({ path: resolve(__dirname, '../../../.env') })

import { scrapeMapsWorker } from './scrape-maps'
import { scrapeEmailsWorker } from './scrape-emails'
import { sendEmailsWorker } from './send-emails'

console.log('🔧 Starting BullMQ workers...')

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 SIGTERM received, closing workers...')
  await Promise.all([
    scrapeMapsWorker.close(),
    scrapeEmailsWorker.close(),
    sendEmailsWorker.close(),
  ])
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('📴 SIGINT received, closing workers...')
  await Promise.all([
    scrapeMapsWorker.close(),
    scrapeEmailsWorker.close(),
    sendEmailsWorker.close(),
  ])
  process.exit(0)
})

console.log('✅ Workers started successfully')
console.log('  - Scrape Maps Worker (concurrency: 2)')
console.log('  - Scrape Emails Worker (concurrency: 3)')
console.log('  - Send Emails Worker (concurrency: 1)')
