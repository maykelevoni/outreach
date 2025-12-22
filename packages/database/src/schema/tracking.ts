import { pgTable, uuid, varchar, timestamp, text, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core'
import { emails } from './emails'

export const emailEventTypeEnum = pgEnum('email_event_type', [
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'complained',
  'unsubscribed',
])

export const emailEvents = pgTable('email_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailId: uuid('email_id')
    .references(() => emails.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: emailEventTypeEnum('event_type').notNull(),
  metadata: jsonb('metadata').$type<{
    ip?: string
    userAgent?: string
    linkUrl?: string
    bounceType?: string
    errorCode?: string
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const emailLinks = pgTable('email_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailId: uuid('email_id')
    .references(() => emails.id, { onDelete: 'cascade' })
    .notNull(),
  originalUrl: varchar('original_url', { length: 1000 }).notNull(),
  trackingToken: varchar('tracking_token', { length: 255 }).unique().notNull(),
  clickCount: integer('click_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sendingSchedule = pgTable('sending_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayNumber: integer('day_number').notNull().unique(),
  maxEmails: integer('max_emails').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type EmailEvent = typeof emailEvents.$inferSelect
export type NewEmailEvent = typeof emailEvents.$inferInsert
export type EmailLink = typeof emailLinks.$inferSelect
export type NewEmailLink = typeof emailLinks.$inferInsert
export type SendingSchedule = typeof sendingSchedule.$inferSelect
export type NewSendingSchedule = typeof sendingSchedule.$inferInsert
