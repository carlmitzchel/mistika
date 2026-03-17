import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, payments } from '@/db/schema'
import { ok, err, requireAuth } from '@/lib/api'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('PATCH /api/bills/[slug]/payments/[paymentId]')

const UpdatePaymentSchema = z.object({
  status: z.enum(['confirmed', 'rejected']),
  rejectionNote: z.string().max(300).optional(),
})

// PATCH /api/bills/:slug/payments/:paymentId — confirm or reject
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; paymentId: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug, paymentId } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.organizerId !== userId) return err('Forbidden', 403)

  const body = await req.json().catch(() => null)
  const parsed = UpdatePaymentSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.billId, bill.id)))
  if (!payment) return err('Payment not found', 404)

  if (payment.status === 'confirmed') return err('Payment already confirmed', 400)

  const [updated] = await db
    .update(payments)
    .set({
      status: parsed.data.status,
      rejectionNote: parsed.data.rejectionNote ?? null,
      confirmedBy: parsed.data.status === 'confirmed' ? userId : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning()

  logger.info('Payment updated', { billId: bill.id, paymentId, status: updated.status })
  return ok(updated)
}
