import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, participants, items, advancePayments, discountOverrides, payments } from '@/db/schema'
import { ok, err } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { computeShares, isBillSettled } from '@/lib/split-engine'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('GET /api/bills/[slug]/summary')

// GET /api/bills/:slug/summary — computed shares per participant
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)

  logger.info('Computing summary', { billId: bill.id })

  const [billParticipants, billItems, advances, overrides] = await Promise.all([
    db.select().from(participants).where(eq(participants.billId, bill.id)),
    db.select().from(items).where(eq(items.billId, bill.id)),
    db.select().from(advancePayments).where(eq(advancePayments.billId, bill.id)),
    db.select().from(discountOverrides).where(eq(discountOverrides.billId, bill.id)),
  ])

  const advanceMap: Record<string, number> = {}
  for (const a of advances) {
    advanceMap[a.participantId] = (advanceMap[a.participantId] ?? 0) + a.amount
  }

  const overrideMap: Record<string, number> = {}
  for (const o of overrides) {
    overrideMap[`${o.itemId}:${o.participantId}`] = o.overrideAmount
  }

  const shares = computeShares({
    items: billItems.map((i) => ({ ...i, assignedTo: i.assignedTo as string[], source: i.source as 'manual' | 'scan' })),
    participants: billParticipants.map((p) => ({
      ...p,
      discountType: p.discountType as 'pwd' | 'senior' | null,
    })),
    vatRegistered: bill.vatRegistered,
    advancePayments: advanceMap,
    discountOverrides: overrideMap,
  })

  const totalAmount = billItems.reduce((sum, i) => sum + i.price, 0)
  const settled = isBillSettled(shares)

  // Fetch confirmed payment count for status tracking
  const confirmedPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.billId, bill.id))

  const settledCount = billParticipants.filter((p) =>
    confirmedPayments.some(
      (pay) => pay.fromParticipantId === p.id && pay.status === 'confirmed',
    ),
  ).length

  logger.info('Summary computed', { billId: bill.id, totalAmount, settled })

  return ok({ shares, totalAmount, settledCount, totalParticipants: billParticipants.length, settled })
}
