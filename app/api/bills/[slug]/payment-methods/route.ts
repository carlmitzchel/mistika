import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'
import { db } from '@/db'
import { bills, paymentMethods } from '@/db/schema'
import { ok, err, id, requireAuth } from '@/lib/api'
import { eq } from 'drizzle-orm'
import { makeLogger } from '@/lib/logger'

const logger = makeLogger('POST /api/bills/[slug]/payment-methods')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
const MAX_QR_SIZE = 5 * 1024 * 1024 // 5 MB

// GET /api/bills/:slug/payment-methods
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const [bill] = await db.select().from(bills).where(eq(bills.slug, slug))
  if (!bill) return err('Bill not found', 404)

  const methods = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.billId, bill.id))
    .orderBy(paymentMethods.displayOrder)

  return ok(methods)
}

// POST /api/bills/:slug/payment-methods (multipart/form-data)
// Fields: type, label, accountDetails (optional), qrImage (optional file)
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

  const formData = await req.formData().catch(() => null)
  if (!formData) return err('Invalid form data')

  const type = formData.get('type') as string
  const label = formData.get('label') as string
  const accountDetails = formData.get('accountDetails') as string | null

  if (!type || !['gcash', 'maya', 'bank', 'cash'].includes(type)) return err('Invalid type')
  if (!label?.trim()) return err('Label is required')

  let qrImageUrl: string | null = null
  const qrFile = formData.get('qrImage') as File | null

  if (qrFile) {
    if (!ALLOWED_IMAGE_TYPES.includes(qrFile.type)) return err('Invalid QR image type')
    if (qrFile.size > MAX_QR_SIZE) return err('QR image exceeds 5 MB limit')

    const blob = await put(`bills/${bill.id}/qr-${Date.now()}`, qrFile, {
      access: 'public',
      contentType: qrFile.type,
    })
    qrImageUrl = blob.url
    logger.info('QR image uploaded', { billId: bill.id, url: blob.url })
  }

  const existing = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.billId, bill.id))

  const [method] = await db
    .insert(paymentMethods)
    .values({
      id: id(),
      billId: bill.id,
      type,
      label,
      accountDetails: accountDetails ?? null,
      qrImageUrl,
      displayOrder: existing.length,
    })
    .returning()

  logger.info('Payment method added', { billId: bill.id, methodId: method.id, type })
  return ok(method, 201)
}
