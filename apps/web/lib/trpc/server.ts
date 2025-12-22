import { initTRPC } from '@trpc/server'
import { db } from 'database'
import superjson from 'superjson'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,
    ...opts,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
