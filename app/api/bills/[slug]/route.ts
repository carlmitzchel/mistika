import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, participants, items, paymentMethods } from '@/db/schema'
import { ok, err, requireAuth } from '@/lib/api'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const UpdateBillSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  restaurantName: z.string().max(120).nullable().optional(),
  currency: z.string().length(3).optional(),
  defaultSplitMethod: z.enum(['equal', 'item']).optional(),
  vatRegistered: z.boolean().optional(),
  status: z.enum(['open', 'settling', 'settled', 'archived']).optional(),
})

// GET /api/bills/:slug — full bill detail (bill + participants + items + payment methods)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)

  const [billParticipants, billItems, billPaymentMethods] = await Promise.all([
    db.select().from(participants).where(eq(participants.billId, bill.id)),
    db.select().from(items).where(eq(items.billId, bill.id)),
    db.select().from(paymentMethods).where(eq(paymentMethods.billId, bill.id))
      .orderBy(paymentMethods.displayOrder),
  ])

  return ok({ bill, participants: billParticipants, items: billItems, paymentMethods: billPaymentMethods })
}

// PATCH /api/bills/:slug — update bill metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug } = await params
  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.organizerId !== userId) return err('Forbidden', 403)

  const body = await req.json().catch(() => null)
  const parsed = UpdateBillSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const [updated] = await db
    .update(bills)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(bills.slug, slug), eq(bills.organizerId, userId)))
    .returning()

  return ok(updated)
}

// DELETE /api/bills/:slug — soft delete (archive)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug } = await params
  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.organizerId !== userId) return err('Forbidden', 403)

  await db
    .update(bills)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(bills.slug, slug))

  return ok({ success: true })
}
