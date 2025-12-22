import { createTRPCRouter } from '../server'
import { campaignsRouter } from './campaigns'
import { leadsRouter } from './leads'
import { templatesRouter } from './templates'

export const appRouter = createTRPCRouter({
  campaigns: campaignsRouter,
  leads: leadsRouter,
  templates: templatesRouter,
})

export type AppRouter = typeof appRouter
