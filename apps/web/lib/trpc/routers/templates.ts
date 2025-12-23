import { z } from 'zod'
import { createTRPCRouter, publicProcedure } from '../server'
import { emailTemplates } from 'database'
import { eq } from 'drizzle-orm'
import { templateEngine, renderEmailTemplate, type TemplateVariables } from '../../../../../packages/email/src/templates/engine'

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  bodyHtml: z.string().min(1),
  bodyText: z.string().min(1),
  variables: z.array(z.string()),
  isDefault: z.boolean().optional(),
})

export const templatesRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(emailTemplates)
  }),

  getById: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.select().from(emailTemplates).where(eq(emailTemplates.id, input))
      return template[0] || null
    }),

  create: publicProcedure
    .input(createTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db.insert(emailTemplates).values(input).returning()
      return template
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: createTemplateSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .update(emailTemplates)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(emailTemplates.id, input.id))
        .returning()
      return template
    }),

  delete: publicProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input: id }) => {
      await ctx.db.delete(emailTemplates).where(eq(emailTemplates.id, id))
      return { success: true }
    }),

  preview: publicProcedure
    .input(
      z.object({
        template: z.string(),
        variables: z.record(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const rendered = templateEngine.render(input.template, input.variables as TemplateVariables)
        return { success: true, rendered }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid template',
        }
      }
    }),

  validateTemplate: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: template }) => {
      return templateEngine.validateTemplate(template)
    }),

  extractVariables: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: template }) => {
      const variables = templateEngine.extractVariables(template)
      return { variables }
    }),
})
