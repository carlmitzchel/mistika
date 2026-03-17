import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bills, discountOverrides } from '@/db/schema'
import { ok, err, id, requireAuth } from '@/lib/api'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('POST /api/bills/[slug]/discount-overrides')

const OverrideSchema = z.object({
  itemId: z.string(),
  participantId: z.string(),
  overrideAmount: z.number().int().min(0), // centavos; 0 = no discount
})

// POST /api/bills/:slug/discount-overrides — set or replace a manual override
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

  const body = await req.json().catch(() => null)
  const parsed = OverrideSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.message)

  const { itemId, participantId, overrideAmount } = parsed.data

  // Delete existing override for this item+participant combo, then insert new
  await db
    .delete(discountOverrides)
    .where(
      and(
        eq(discountOverrides.billId, bill.id),
        eq(discountOverrides.itemId, itemId),
        eq(discountOverrides.participantId, participantId),
      ),
    )

  const [override] = await db
    .insert(discountOverrides)
    .values({ id: id(), billId: bill.id, itemId, participantId, overrideAmount })
    .returning()

  logger.info('Discount override set', { billId: bill.id, itemId, participantId, overrideAmount })
  return ok(override, 201)
}
