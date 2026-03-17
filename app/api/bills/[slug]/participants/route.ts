import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, participants } from '@/db/schema'
import { ok, err, id } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('POST /api/bills/[slug]/participants')

const AddParticipantSchema = z.object({
  displayName: z.string().min(1).max(80),
  discountType: z.enum(['pwd', 'senior']).nullable().optional(),
})

// POST /api/bills/:slug/participants — add a participant (organizer or self-join)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.status === 'archived') return err('Bill is archived', 400)

  const body = await req.json().catch(() => null)
  const parsed = AddParticipantSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const { displayName, discountType } = parsed.data

  // Deduplicate: warn if name already exists (still allow — caller decides)
  const existing = await db
    .select()
    .from(participants)
    .where(eq(participants.billId, bill.id))

  const nameTaken = existing.some(
    (p) => p.displayName.toLowerCase() === displayName.toLowerCase(),
  )
  if (nameTaken) {
    logger.warn('Duplicate participant name', { billId: bill.id, displayName })
    return err('A participant with this name already exists. Use a different name.', 409)
  }

  const [participant] = await db
    .insert(participants)
    .values({
      id: id(),
      billId: bill.id,
      displayName,
      userId: null,
      discountType: discountType ?? null,
    })
    .returning()

  logger.info('Participant added', { billId: bill.id, participantId: participant.id })
  return ok(participant, 201)
}
