import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { currentUser } from '@clerk/nextjs/server'

/**
 * Ensures the current Clerk user exists in our users table.
 * Call this before any operation that requires a users row (e.g., creating a bill).
 */
export async function ensureUser(userId: string): Promise<void> {
  const [existing] = await db.select().from(users).where(eq(users.id, userId))
  if (existing) return

  const clerkUser = await currentUser()
  if (!clerkUser) return

  await db.insert(users).values({
    id: userId,
    email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
    displayName:
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName ?? clerkUser.emailAddresses[0]?.emailAddress ?? 'User',
  }).onConflictDoNothing()
}
