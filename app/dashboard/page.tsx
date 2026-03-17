import Link from 'next/link'

const mockBills = [
  {
    slug: 'abc-123',
    title: 'Dinner at Manam 🍖',
    restaurantName: 'Manam',
    currency: 'PHP',
    status: 'settling',
    totalAmount: 240000,
    participantCount: 5,
    settledCount: 3,
    createdAt: '2026-03-15',
  },
  {
    slug: 'def-456',
    title: 'Inihaw Night 🔥',
    restaurantName: null,
    currency: 'PHP',
    status: 'settled',
    totalAmount: 180000,
    participantCount: 4,
    settledCount: 4,
    createdAt: '2026-03-10',
  },
  {
    slug: 'ghi-789',
    title: 'Family Sunday Lunch 🥘',
    restaurantName: "Gerry's Grill",
    currency: 'PHP',
    status: 'open',
    totalAmount: 560000,
    participantCount: 8,
    settledCount: 0,
    createdAt: '2026-03-17',
  },
]

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

export default function DashboardPage() {
  if (mockBills.length === 0) {
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
        {mockBills.map((bill, i) => {
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
                <span>{bill.createdAt}</span>
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
