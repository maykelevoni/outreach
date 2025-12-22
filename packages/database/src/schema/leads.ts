import { pgTable, uuid, varchar, timestamp, text, real, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { campaigns } from './campaigns'

export const leadStatusEnum = pgEnum('lead_status', [
  'pending',
  'email_found',
  'email_sent',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'unsubscribed',
])

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id, { onDelete: 'cascade' })
    .notNull(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  website: varchar('website', { length: 500 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  mapsUrl: varchar('maps_url', { length: 500 }),
  rating: real('rating'),
  reviewCount: integer('review_count'),
  categories: text('categories').array(),
  status: leadStatusEnum('status').default('pending').notNull(),
  enrichmentData: jsonb('enrichment_data').$type<{
    firstName?: string
    lastName?: string
    jobTitle?: string
    companySize?: string
    industry?: string
    socialLinks?: {
      linkedin?: string
      twitter?: string
      facebook?: string
    }
  }>(),
  scrapedAt: timestamp('scraped_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
