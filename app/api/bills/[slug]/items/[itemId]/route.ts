import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, items } from '@/db/schema'
import { ok, err, requireAuth } from '@/lib/api'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('PATCH /api/bills/[slug]/items/[itemId]')

const UpdateItemSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  price: z.number().int().positive().optional(),
  assignedTo: z.array(z.string()).optional(),
  discountEligible: z.boolean().optional(),
})

async function getBillAndAssert(slug: string, userId: string) {
  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return { bill: null, error: err('Bill not found', 404) }
  if (bill.organizerId !== userId) return { bill: null, error: err('Forbidden', 403) }
  return { bill, error: null }
}

// PATCH /api/bills/:slug/items/:itemId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug, itemId } = await params
  const { bill, error } = await getBillAndAssert(slug, userId)
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = UpdateItemSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const [updated] = await db
    .update(items)
    .set(parsed.data)
    .where(and(eq(items.id, itemId), eq(items.billId, bill!.id)))
    .returning()

  if (!updated) return err('Item not found', 404)

  logger.info('Item updated', { billId: bill!.id, itemId })
  return ok(updated)
}

// DELETE /api/bills/:slug/items/:itemId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; itemId: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug, itemId } = await params
  const { bill, error } = await getBillAndAssert(slug, userId)
  if (error) return error

  await db
    .delete(items)
    .where(and(eq(items.id, itemId), eq(items.billId, bill!.id)))

  logger.info('Item deleted', { billId: bill!.id, itemId })
  return ok({ success: true })
}
