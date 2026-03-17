import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, items } from '@/db/schema'
import { ok, err, id, requireAuth } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('POST /api/bills/[slug]/items')

const AddItemSchema = z.object({
  name: z.string().min(1).max(120),
  price: z.number().int().positive(),       // centavos
  assignedTo: z.array(z.string()).optional().default([]),
  discountEligible: z.boolean().optional().default(true),
  source: z.enum(['manual', 'scan']).optional().default('manual'),
})

// POST /api/bills/:slug/items
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.organizerId !== userId) return err('Forbidden', 403)
  if (bill.status === 'archived') return err('Bill is archived', 400)

  const body = await req.json().catch(() => null)
  const parsed = AddItemSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const [item] = await db
    .insert(items)
    .values({ id: id(), billId: bill.id, ...parsed.data })
    .returning()

  logger.info('Item added', { billId: bill.id, itemId: item.id, price: item.price })
  return ok(item, 201)
}
