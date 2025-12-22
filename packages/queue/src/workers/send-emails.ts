import { Worker, Job } from 'bullmq'
import { db, leads, emails, emailTemplates, campaigns, sendingSchedule } from 'database'
import { eq, and, gte, lt, sql } from 'drizzle-orm'
import {
  composeAndSendEmail,
  createWarmUpScheduler,
  type EmailTemplate,
  type TemplateVariables,
} from 'email'
import { redisConnection } from '../config'

export interface SendEmailJobData {
  emailId: string
  leadId: string
  campaignId: string
  templateId: string
}

// Worker with concurrency of 1 (sequential sending)
export const sendEmailsWorker = new Worker<SendEmailJobData>(
  'send-emails',
  async (job: Job<SendEmailJobData>) => {
    console.log(`📧 Processing email send job ${job.id}`)

    const { emailId, leadId, campaignId, templateId } = job.data

    try {
      // Get lead, campaign, and template data
      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId))
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId))
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))

      if (!lead || !campaign || !template) {
        throw new Error('Lead, campaign, or template not found')
      }

      if (!lead.email) {
        throw new Error('Lead does not have an email address')
      }

      // Check warm-up limits
      const warmUpEnabled = process.env.WARM_UP_ENABLED === 'true'

      if (warmUpEnabled) {
        // Get or create sending schedule
        let schedule = await db
          .select()
          .from(sendingSchedule)
          .where(eq(sendingSchedule.id, 'default'))

        if (schedule.length === 0) {
          // Create default schedule starting today
          await db.insert(sendingSchedule).values({
            id: 'default',
            startDate: new Date(),
            currentDay: 1,
            emailsSentToday: 0,
            lastResetDate: new Date(),
          })

          schedule = await db
            .select()
            .from(sendingSchedule)
            .where(eq(sendingSchedule.id, 'default'))
        }

        const currentSchedule = schedule[0]

        // Create warm-up scheduler
        const scheduler = createWarmUpScheduler(currentSchedule.startDate)

        // Get emails sent today and this hour
        const now = new Date()
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)

        const startOfHour = new Date(now)
        startOfHour.setMinutes(0, 0, 0)

        const [sentToday] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(emails)
          .where(
            and(eq(emails.status, 'sent'), gte(emails.sentAt, startOfDay), lt(emails.sentAt, now))
          )

        const [sentThisHour] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(emails)
          .where(
            and(
              eq(emails.status, 'sent'),
              gte(emails.sentAt, startOfHour),
              lt(emails.sentAt, now)
            )
          )

        const sentTodayCount = sentToday?.count || 0
        const sentThisHourCount = sentThisHour?.count || 0

        // Check if we can send
        if (!scheduler.canSendEmail(sentTodayCount, sentThisHourCount)) {
          const nextTime = scheduler.getNextAvailableTime(sentTodayCount, sentThisHourCount)

          if (nextTime) {
            console.log(
              `⏰ Rate limit reached. Rescheduling email for ${nextTime.toISOString()}`
            )

            // Reschedule the job
            const delay = nextTime.getTime() - Date.now()
            await job.updateData({ ...job.data })
            await job.moveToDelayed(delay, job.token || '')

            return {
              success: false,
              rescheduled: true,
              nextTime: nextTime.toISOString(),
            }
          }
        }

        // Add random delay to avoid patterns
        const delay = scheduler.getRandomDelay()
        console.log(`⏳ Waiting ${Math.round(delay / 1000)} seconds before sending...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      // Prepare template variables
      const variables: TemplateVariables = {
        firstName: lead.enrichmentData?.firstName || lead.businessName,
        lastName: lead.enrichmentData?.lastName,
        businessName: lead.businessName,
        location: campaign.location,
        rating: lead.rating || undefined,
        reviewCount: lead.reviewCount || undefined,
        website: lead.website || undefined,
        phone: lead.phone || undefined,
        address: lead.address || undefined,
        senderName: campaign.settings?.senderName || 'Your Name',
        senderCompany: campaign.settings?.senderCompany || 'Your Company',
        senderEmail: campaign.settings?.senderEmail,
      }

      const emailTemplate: EmailTemplate = {
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText,
      }

      // Send email
      const fromEmail = campaign.settings?.fromEmail || process.env.FROM_EMAIL || 'noreply@example.com'
      const replyToEmail = campaign.settings?.replyToEmail

      console.log(`📨 Sending email to ${lead.email}...`)

      const result = await composeAndSendEmail({
        template: emailTemplate,
        variables,
        from: fromEmail,
        to: lead.email,
        replyTo: replyToEmail,
        trackingEnabled: true,
        campaignId,
        leadId,
      })

      if (!result.success) {
        console.error(`❌ Failed to send email: ${result.error}`)

        // Update email status
        await db
          .update(emails)
          .set({
            status: 'failed',
            error: result.error,
            updatedAt: new Date(),
          })
          .where(eq(emails.id, emailId))

        throw new Error(result.error)
      }

      console.log(`✅ Email sent successfully! Resend ID: ${result.emailId}`)

      // Update email record
      await db
        .update(emails)
        .set({
          status: 'sent',
          resendEmailId: result.emailId,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId))

      // Update lead status
      await db
        .update(leads)
        .set({
          status: 'email_sent',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))

      return {
        success: true,
        emailId: result.emailId,
        lead: lead.businessName,
        email: lead.email,
      }
    } catch (error) {
      console.error(`❌ Error in send email worker:`, error)

      // Update email status to failed
      await db
        .update(emails)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId))

      throw error
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one email at a time
  }
)

sendEmailsWorker.on('completed', (job) => {
  console.log(`✅ Email send job ${job.id} completed`)
})

sendEmailsWorker.on('failed', (job, err) => {
  console.error(`❌ Email send job ${job?.id} failed:`, err)
})

console.log('📧 Send Emails Worker started')
