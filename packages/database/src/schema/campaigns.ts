import { pgTable, uuid, varchar, timestamp, text, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const campaignStatusEnum = pgEnum('campaign_status', [
  'draft',
  'scraping',
  'ready',
  'sending',
  'completed',
  'paused',
])

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  keyword: varchar('keyword', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  templateId: uuid('template_id'),
  settings: jsonb('settings').$type<{
    maxLeads?: number
    emailsPerDay?: number
    sendingSchedule?: {
      start: string // HH:mm format
      end: string   // HH:mm format
    }
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Campaign = typeof campaigns.$inferSelect
export type NewCampaign = typeof campaigns.$inferInsert
