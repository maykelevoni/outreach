import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../server'
import { leads, campaigns, emails } from 'database'
import { eq } from 'drizzle-orm'
import { queueSendEmailJob } from 'queue'

export const leadsRouter = createTRPCRouter({
  listByCampaign: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      return await ctx.db.select().from(leads).where(eq(leads.campaignId, input))
    }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const lead = await ctx.db.select().from(leads).where(eq(leads.id, input))
      return lead[0] || null
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'email_found', 'email_sent', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed']),
    }))
    .mutation(async ({ ctx, input }) => {
      const [lead] = await ctx.db
        .update(leads)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(leads.id, input.id))
        .returning()
      return lead
    }),

  sendEmail: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: leadId }) => {
      // Get the lead
      const [lead] = await ctx.db.select().from(leads).where(eq(leads.id, leadId))
      if (!lead) {
        throw new Error('Lead not found')
      }

      if (!lead.email) {
        throw new Error('Lead has no email address')
      }

      // Get the campaign to find the template
      const [campaign] = await ctx.db.select().from(campaigns).where(eq(campaigns.id, lead.campaignId))
      if (!campaign) {
        throw new Error('Campaign not found')
      }

      if (!campaign.templateId) {
        throw new Error('Campaign has no email template selected')
      }

      // Create email record
      const [email] = await ctx.db
        .insert(emails)
        .values({
          leadId: lead.id,
          campaignId: lead.campaignId,
          templateId: campaign.templateId,
          to: lead.email,
          status: 'pending',
        })
        .returning()

      // Queue the email job
      await queueSendEmailJob({
        emailId: email.id,
        leadId: lead.id,
        campaignId: lead.campaignId,
        templateId: campaign.templateId,
      })

      return { success: true, emailId: email.id }
    }),
})
