import { pgTable, uuid, varchar, timestamp, text, pgEnum } from 'drizzle-orm/pg-core'
import { leads } from './leads'
import { campaigns } from './campaigns'
import { emailTemplates } from './templates'

export const emailStatusEnum = pgEnum('email_status', [
  'queued',
  'sending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'replied',
  'bounced',
  'failed',
])

export const emails = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .references(() => leads.id, { onDelete: 'cascade' })
    .notNull(),
  campaignId: uuid('campaign_id')
    .references(() => campaigns.id, { onDelete: 'cascade' })
    .notNull(),
  templateId: uuid('template_id')
    .references(() => emailTemplates.id)
    .notNull(),
  resendEmailId: varchar('resend_email_id', { length: 255 }),
  subject: varchar('subject', { length: 500 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  status: emailStatusEnum('status').default('queued').notNull(),
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Email = typeof emails.$inferSelect
export type NewEmail = typeof emails.$inferInsert
