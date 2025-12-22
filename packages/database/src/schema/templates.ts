import { pgTable, uuid, varchar, timestamp, text, boolean } from 'drizzle-orm/pg-core'

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  variables: text('variables').array().notNull(), // e.g., ['firstName', 'businessName', 'location']
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type EmailTemplate = typeof emailTemplates.$inferSelect
export type NewEmailTemplate = typeof emailTemplates.$inferInsert
