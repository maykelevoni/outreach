import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../server'
import { campaigns, leads, emails } from 'database'
import { eq, sql, and } from 'drizzle-orm'

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  keyword: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  templateId: z.string().uuid().optional(),
  settings: z.object({
    maxLeads: z.number().int().positive().optional(),
    emailsPerDay: z.number().int().positive().optional(),
    sendingSchedule: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
    }).optional(),
  }).optional(),
}).passthrough() // Allow extra fields for debugging

export const campaignsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    // Get campaigns with lead counts
    const result = await ctx.db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        keyword: campaigns.keyword,
        location: campaigns.location,
        status: campaigns.status,
        templateId: campaigns.templateId,
        settings: campaigns.settings,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
        leadCount: sql<number>`count(${leads.id})::int`,
      })
      .from(campaigns)
      .leftJoin(leads, eq(campaigns.id, leads.campaignId))
      .groupBy(campaigns.id)
      .orderBy(campaigns.createdAt)

    return result
  }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.select().from(campaigns).where(eq(campaigns.id, input))
      return campaign[0] || null
    }),

  create: publicProcedure
    .input(createCampaignSchema)
    .mutation(async ({ ctx, input }) => {
      console.log('Creating campaign with input:', JSON.stringify(input, null, 2))
      try {
        const [campaign] = await ctx.db.insert(campaigns).values(input).returning()
        console.log('Campaign created successfully:', campaign.id)
        return campaign
      } catch (error) {
        console.error('Error creating campaign:', error)
        throw error
      }
    }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.enum(['draft', 'scraping', 'ready', 'sending', 'completed', 'paused']),
    }))
    .mutation(async ({ ctx, input }) => {
      const [campaign] = await ctx.db
        .update(campaigns)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(campaigns.id, input.id))
        .returning()
      return campaign
    }),

  startScraping: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: campaignId }) => {
      // Get campaign details
      const campaign = await ctx.db.select().from(campaigns).where(eq(campaigns.id, campaignId))
      if (!campaign[0]) {
        throw new Error('Campaign not found')
      }

      const { queueMapsScrapingJob } = await import('queue')

      // Queue scraping job with BullMQ
      await queueMapsScrapingJob({
        campaignId: campaign[0].id,
        keyword: campaign[0].keyword,
        location: campaign[0].location,
        maxResults: campaign[0].settings?.maxLeads || 100,
      })

      return { success: true, campaign: campaign[0] }
    }),

  getStats: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input: campaignId }) => {
      // Get total leads
      const totalLeads = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(eq(leads.campaignId, campaignId))

      // Get leads with emails
      const leadsWithEmail = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .where(and(eq(leads.campaignId, campaignId), sql`${leads.email} IS NOT NULL`))

      // Get email stats
      const campaignLeadIds = ctx.db
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.campaignId, campaignId))

      const emailsSent = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(emails)
        .where(sql`${emails.leadId} IN ${campaignLeadIds}`)

      const emailsOpened = await ctx.db
        .select({ count: sql<number>`count(distinct ${emails.leadId})::int` })
        .from(emails)
        .where(and(sql`${emails.leadId} IN ${campaignLeadIds}`, eq(emails.status, 'opened')))

      const emailsClicked = await ctx.db
        .select({ count: sql<number>`count(distinct ${emails.leadId})::int` })
        .from(emails)
        .where(and(sql`${emails.leadId} IN ${campaignLeadIds}`, eq(emails.status, 'clicked')))

      const sent = emailsSent[0]?.count || 0
      const opened = emailsOpened[0]?.count || 0
      const clicked = emailsClicked[0]?.count || 0

      return {
        totalLeads: totalLeads[0]?.count || 0,
        leadsWithEmail: leadsWithEmail[0]?.count || 0,
        emailsSent: sent,
        emailsOpened: opened,
        emailsClicked: clicked,
        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
      }
    }),

  startSending: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: campaignId }) => {
      const campaign = await ctx.db.select().from(campaigns).where(eq(campaigns.id, campaignId))
      if (!campaign[0]) {
        throw new Error('Campaign not found')
      }

      if (!campaign[0].templateId) {
        throw new Error('Campaign must have a template before sending')
      }

      // Get leads with emails that haven't been sent to yet
      const leadsToSend = await ctx.db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.campaignId, campaignId),
            sql`${leads.email} IS NOT NULL`,
            eq(leads.status, 'email_found')
          )
        )

      if (leadsToSend.length === 0) {
        throw new Error('No leads available to send emails to')
      }

      const { queueSendEmailJob } = await import('queue')
      const { emails: emailsTable } = await import('database')

      // Create email records and queue send jobs
      for (const lead of leadsToSend) {
        // Create email record
        const [emailRecord] = await ctx.db
          .insert(emailsTable)
          .values({
            leadId: lead.id,
            campaignId,
            templateId: campaign[0].templateId!,
            status: 'queued',
          })
          .returning()

        // Queue send job
        await queueSendEmailJob({
          emailId: emailRecord.id,
          leadId: lead.id,
          campaignId,
          templateId: campaign[0].templateId!,
        })
      }

      // Update campaign status
      await ctx.db
        .update(campaigns)
        .set({ status: 'sending', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId))

      return { success: true, queued: leadsToSend.length }
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      keyword: z.string().min(1).max(255).optional(),
      location: z.string().min(1).max(255).optional(),
      templateId: z.string().uuid().optional().nullable(),
      settings: z.object({
        maxLeads: z.number().int().positive().optional(),
        emailsPerDay: z.number().int().positive().optional(),
        sendingSchedule: z.object({
          start: z.string().regex(/^\d{2}:\d{2}$/),
          end: z.string().regex(/^\d{2}:\d{2}$/),
        }).optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input
      const [campaign] = await ctx.db
        .update(campaigns)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(campaigns.id, id))
        .returning()
      return campaign
    }),

  delete: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: campaignId }) => {
      // Delete associated leads first (cascade)
      await ctx.db.delete(leads).where(eq(leads.campaignId, campaignId))

      // Delete the campaign
      await ctx.db.delete(campaigns).where(eq(campaigns.id, campaignId))

      return { success: true }
    }),
})
