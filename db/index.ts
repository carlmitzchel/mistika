import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Run `vercel env pull` to get your database credentials.')
  }
  return drizzle(neon(process.env.DATABASE_URL), { schema })
}

type DbInstance = ReturnType<typeof createDb>

// Lazy proxy — only connects when a route handler actually calls it at runtime.
// This prevents build-time failures when DATABASE_URL is not set.
export const db = new Proxy({} as DbInstance, {
  get(_t, prop) {
    return createDb()[prop as keyof DbInstance]
  },
})
