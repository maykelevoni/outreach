import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, '../../.env') })

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
