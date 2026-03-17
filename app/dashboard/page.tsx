import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { bills, participants, items, payments } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

function fmt(centavos: number): string {
  return '₱' + (centavos / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'open') return <span className="badge badge-open">🕐 Open</span>
  if (status === 'settling') return <span className="badge badge-pending">💰 Settling</span>
  if (status === 'settled') return <span className="badge badge-settled">✅ Settled</span>
  return null
}

const rotations = ['rotate-[-0.5deg]', 'rotate-[0.5deg]']

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null // proxy.ts handles redirect

  // Fetch organizer's bills (exclude archived)
  const userBills = await db
    .select()
    .from(bills)
    .where(eq(bills.organizerId, userId))
    .orderBy(bills.createdAt)

  const activeBills = userBills.filter((b) => b.status !== 'archived')

  if (activeBills.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <span className="text-7xl">🍽️</span>
        <h2
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          No bills yet!
        </h2>
        <p className="text-[#6B7280]">Create your first bill to get started</p>
        <Link href="/dashboard/bills/new" className="btn-doodle btn-coral mt-2">
          New Bill +
        </Link>
      </div>
    )
  }

  // Batch-fetch participants, items, and confirmed payments for all bills
  const billIds = activeBills.map((b) => b.id)

  const [allParticipants, allItems, allPayments] = await Promise.all([
    db.select().from(participants).where(inArray(participants.billId, billIds)),
    db.select().from(items).where(inArray(items.billId, billIds)),
    db.select().from(payments).where(inArray(payments.billId, billIds)),
  ])

  // Aggregate per bill
  const billSummaries = activeBills.map((bill) => {
    const billParticipants = allParticipants.filter((p) => p.billId === bill.id)
    const billItems = allItems.filter((i) => i.billId === bill.id)
    const billPayments = allPayments.filter((p) => p.billId === bill.id)

    const totalAmount = billItems.reduce((sum, i) => sum + i.price, 0)
    const participantCount = billParticipants.length
    const settledCount = billParticipants.filter((p) =>
      billPayments.some(
        (pay) => pay.fromParticipantId === p.id && pay.status === 'confirmed',
      ),
    ).length

    return { ...bill, totalAmount, participantCount, settledCount }
  })

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          Your Bills 🧾
        </h1>
        <Link href="/dashboard/bills/new" className="btn-doodle btn-coral text-sm">
          New Bill +
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {billSummaries.map((bill, i) => {
          const progressPct =
            bill.participantCount > 0
              ? Math.round((bill.settledCount / bill.participantCount) * 100)
              : 0

          return (
            <Link
              key={bill.slug}
              href={`/dashboard/bills/${bill.slug}`}
              className={`doodle-card p-4 block hover:translate-y-[-2px] transition-transform ${rotations[i % 2]}`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-caveat)' }}
                >
                  {bill.title}
                </h2>
                <StatusBadge status={bill.status} />
              </div>

              <div className="flex items-center gap-3 text-sm text-[#6B7280] mb-3">
                {bill.restaurantName && (
                  <span>📍 {bill.restaurantName}</span>
                )}
                <span>{bill.createdAt.toLocaleDateString()}</span>
                <span className="font-semibold text-[#1C1C1C]">{bill.currency}</span>
              </div>

              <div className="text-2xl font-bold text-[#1C1C1C] mb-3">
                {fmt(bill.totalAmount)}
              </div>

              <div className="progress-track mb-1.5">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-[#6B7280]">
                👥 {bill.settledCount}/{bill.participantCount} paid
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
