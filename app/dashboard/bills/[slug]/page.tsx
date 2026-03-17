'use client'

import { useState } from 'react'
import Link from 'next/link'

const mockBill = {
  slug: 'abc-123',
  title: 'Dinner at Manam 🍖',
  restaurantName: 'Manam',
  currency: 'PHP',
  status: 'settling',
  vatRegistered: true,
}

const mockParticipants = [
  { id: 'p1', displayName: 'Bea', discountType: null },
  { id: 'p2', displayName: 'Carlo', discountType: null },
  { id: 'p3', displayName: 'Lolo Ben', discountType: 'senior' },
  { id: 'p4', displayName: 'Ate Linda', discountType: null },
  { id: 'p5', displayName: 'Miguel', discountType: null },
]

const mockShares = [
  { participantId: 'p1', displayName: 'Bea', grossAmount: 48000, discountAmount: 0, netAmount: 48000, advancePaid: 240000, balance: -192000 },
  { participantId: 'p2', displayName: 'Carlo', grossAmount: 48000, discountAmount: 0, netAmount: 48000, advancePaid: 48000, balance: 0 },
  { participantId: 'p3', displayName: 'Lolo Ben 🧓', grossAmount: 48000, discountAmount: 8571, netAmount: 39429, advancePaid: 0, balance: 39429 },
  { participantId: 'p4', displayName: 'Ate Linda', grossAmount: 48000, discountAmount: 0, netAmount: 48000, advancePaid: 0, balance: 48000 },
  { participantId: 'p5', displayName: 'Miguel', grossAmount: 48000, discountAmount: 0, netAmount: 48000, advancePaid: 0, balance: 48000 },
]

const initialPaymentStatuses: Record<string, string> = {
  p1: 'confirmed',
  p2: 'confirmed',
  p3: 'proof_submitted',
  p4: 'pending',
  p5: 'pending',
}

function fmt(centavos: number): string {
  return '₱' + (centavos / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'open') return <span className="badge badge-open">🕐 Open</span>
  if (status === 'settling') return <span className="badge badge-pending">💰 Settling</span>
  if (status === 'settled') return <span className="badge badge-settled">✅ Settled</span>
  return null
}

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === 'pending') return <span className="badge badge-open">🕐 Waiting</span>
  if (status === 'proof_submitted') return <span className="badge badge-proof">📎 Proof sent</span>
  if (status === 'confirmed') return <span className="badge badge-settled">✅ Paid</span>
  if (status === 'rejected') return <span className="badge badge-rejected">❌ Rejected</span>
  return null
}

export default function BillDetailPage() {
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, string>>(initialPaymentStatuses)
  const [copied, setCopied] = useState(false)

  const totalAmount = mockShares.reduce((sum, s) => sum + s.netAmount, 0)

  const discountTypeLabel = (type: string | null) => {
    if (type === 'pwd') return <span className="badge" style={{ background: '#C4B5FD' }}>🦽 PWD</span>
    if (type === 'senior') return <span className="badge" style={{ background: '#C4B5FD' }}>🧓 Senior</span>
    return null
  }

  const handleConfirm = (participantId: string) => {
    setPaymentStatuses((prev) => ({ ...prev, [participantId]: 'confirmed' }))
  }

  const handleReject = (participantId: string) => {
    setPaymentStatuses((prev) => ({ ...prev, [participantId]: 'rejected' }))
  }

  const handleMarkPaid = (participantId: string) => {
    setPaymentStatuses((prev) => ({ ...prev, [participantId]: 'confirmed' }))
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const rotations = ['rotate-[-0.3deg]', 'rotate-[0.3deg]']

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Link
          href="/dashboard"
          className="text-xl font-bold hover:opacity-70 transition-opacity"
          aria-label="Back to dashboard"
        >
          ←
        </Link>
        <h1
          className="text-3xl font-bold leading-tight"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          {mockBill.title}
        </h1>
      </div>

      <div className="flex items-center gap-3 ml-9 mb-4 text-sm text-[#6B7280]">
        {mockBill.restaurantName && <span>📍 {mockBill.restaurantName}</span>}
        <StatusBadge status={mockBill.status} />
        <button
          onClick={handleCopyLink}
          className="btn-doodle btn-ghost text-xs px-3 py-1 ml-auto"
          style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
        >
          {copied ? '✅ Copied!' : '🔗 Share link'}
        </button>
      </div>

      {/* Participants section */}
      <h2
        className="text-xl font-bold mb-3"
        style={{ fontFamily: 'var(--font-caveat)' }}
      >
        👥 Participants
      </h2>

      <div className="flex flex-col gap-3 mb-6">
        {mockShares.map((share, i) => {
          const participant = mockParticipants.find((p) => p.id === share.participantId)
          const payStatus = paymentStatuses[share.participantId]

          return (
            <div
              key={share.participantId}
              className={`doodle-card-sm p-3 ${rotations[i % 2]}`}
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                {/* Left: name + discount badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{share.displayName}</span>
                  {participant && discountTypeLabel(participant.discountType)}
                </div>

                {/* Right: payment status badge */}
                <PaymentStatusBadge status={payStatus} />
              </div>

              <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                {/* Amount description */}
                <span className="text-sm font-semibold text-[#6B7280]">
                  {share.balance > 0
                    ? `owes ${fmt(share.balance)}`
                    : share.balance < 0
                    ? `paid ${fmt(Math.abs(share.balance))} upfront`
                    : 'settled ✓'}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {payStatus === 'proof_submitted' && (
                    <>
                      <button
                        onClick={() => handleConfirm(share.participantId)}
                        className="btn-doodle btn-mint"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                      >
                        ✅ Confirm
                      </button>
                      <button
                        onClick={() => handleReject(share.participantId)}
                        className="btn-doodle btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                      >
                        ❌ Reject
                      </button>
                    </>
                  )}
                  {payStatus === 'pending' && (
                    <button
                      onClick={() => handleMarkPaid(share.participantId)}
                      className="btn-doodle btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                    >
                      Mark paid 💵
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total summary card */}
      <div
        className="doodle-card p-4 rotate-[-0.3deg]"
        style={{ background: '#FFD93D' }}
      >
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          💰 Total: {fmt(totalAmount)}
        </p>
        <p className="text-sm font-semibold text-[#1C1C1C] opacity-70 mt-0.5">
          {mockParticipants.length} participants · {mockBill.currency}
          {mockBill.vatRegistered ? ' · VAT Registered' : ''}
        </p>
      </div>
    </div>
  )
}
