import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, participants } from '@/db/schema'
import { ok, err, requireAuth } from '@/lib/api'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('PATCH /api/bills/[slug]/participants/[participantId]')

const UpdateParticipantSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  discountType: z.enum(['pwd', 'senior']).nullable().optional(),
})

// PATCH /api/bills/:slug/participants/:participantId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; participantId: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug, participantId } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.organizerId !== userId) return err('Forbidden', 403)

  const body = await req.json().catch(() => null)
  const parsed = UpdateParticipantSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const [updated] = await db
    .update(participants)
    .set(parsed.data)
    .where(and(eq(participants.id, participantId), eq(participants.billId, bill.id)))
    .returning()

  if (!updated) return err('Participant not found', 404)

  logger.info('Participant updated', { billId: bill.id, participantId })
  return ok(updated)
}

// DELETE /api/bills/:slug/participants/:participantId
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; participantId: string }> },
) {
  let userId: string
  try { userId = await requireAuth() } catch (res) { return res as Response }

  const { slug, participantId } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.organizerId !== userId) return err('Forbidden', 403)

  await db
    .delete(participants)
    .where(and(eq(participants.id, participantId), eq(participants.billId, bill.id)))

  logger.info('Participant removed', { billId: bill.id, participantId })
  return ok({ success: true })
}
