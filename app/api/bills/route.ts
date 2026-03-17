import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills } from '@/db/schema'
import { ok, err, id, slug, requireAuth } from '@/lib/api'
import { ensureUser } from '@/lib/ensure-user'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const CreateBillSchema = z.object({
  title: z.string().min(1).max(120),
  restaurantName: z.string().max(120).optional(),
  currency: z.string().length(3).optional().default('PHP'),
  defaultSplitMethod: z.enum(['equal', 'item']).optional().default('equal'),
  vatRegistered: z.boolean().optional().default(true),
})

// GET /api/bills — list Organizer's bills
export async function GET() {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const rows = await db
    .select()
    .from(bills)
    .where(eq(bills.organizerId, userId))
    .orderBy(bills.createdAt)

  return ok(rows)
}

// POST /api/bills — create a bill
export async function POST(req: NextRequest) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const body = await req.json().catch(() => null)
  const parsed = CreateBillSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const { title, restaurantName, currency, defaultSplitMethod, vatRegistered } = parsed.data

  await ensureUser(userId)

  const billSlug = slug()
  const [bill] = await db
    .insert(bills)
    .values({
      id: id(),
      slug: billSlug,
      title,
      restaurantName: restaurantName ?? null,
      currency,
      defaultSplitMethod,
      vatRegistered,
      status: 'open',
      organizerId: userId,
    })
    .returning()

  return ok(bill, 201)
}
