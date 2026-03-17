import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { bills, payments } from '@/db/schema'
import { ok, err, id } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('POST /api/bills/[slug]/payments')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
const MAX_PROOF_SIZE = 10 * 1024 * 1024 // 10 MB

const PaymentBodySchema = z.object({
  fromParticipantId: z.string(),
  toParticipantId: z.string(),
  amount: z.number().int().positive(),
  method: z.enum(['gcash', 'maya', 'bank', 'cash']),
})

// GET /api/bills/:slug/payments — list all payments for a bill
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)

  const rows = await db.select().from(payments).where(eq(payments.billId, bill.id))
  return ok(rows)
}

// POST /api/bills/:slug/payments (multipart/form-data)
// Fields: fromParticipantId, toParticipantId, amount, method, proofImage? (file)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)
  if (bill.status === 'archived') return err('Bill is archived', 400)

  const formData = await req.formData().catch(() => null)
  if (!formData) return err('Invalid form data')

  const parsed = PaymentBodySchema.safeParse({
    fromParticipantId: formData.get('fromParticipantId'),
    toParticipantId: formData.get('toParticipantId'),
    amount: Number(formData.get('amount')),
    method: formData.get('method'),
  })
  if (!parsed.success) return err(parsed.error.message)

  let proofImageUrl: string | null = null
  const proofFile = formData.get('proofImage') as File | null

  if (proofFile) {
    if (!ALLOWED_IMAGE_TYPES.includes(proofFile.type)) return err('Invalid proof image type')
    if (proofFile.size > MAX_PROOF_SIZE) return err('Proof image exceeds 10 MB limit')

    const blob = await put(`bills/${bill.id}/proof-${Date.now()}`, proofFile, {
      access: 'public',
      contentType: proofFile.type,
    })
    proofImageUrl = blob.url
    logger.info('Proof uploaded', { billId: bill.id, url: blob.url })
  }

  const status = proofImageUrl ? 'proof_submitted' : 'pending'

  const [payment] = await db
    .insert(payments)
    .values({
      id: id(),
      billId: bill.id,
      ...parsed.data,
      proofImageUrl,
      status,
      rejectionNote: null,
      confirmedBy: null,
    })
    .returning()

  logger.info('Payment created', { billId: bill.id, paymentId: payment.id, status })
  return ok(payment, 201)
}
