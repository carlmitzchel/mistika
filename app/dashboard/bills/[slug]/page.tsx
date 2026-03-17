'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Bill {
  id: string
  slug: string
  title: string
  restaurantName: string | null
  currency: string
  status: string
  vatRegistered: boolean
}

interface Participant {
  id: string
  displayName: string
  discountType: string | null
}

interface Share {
  participantId: string
  displayName: string
  grossAmount: number
  discountAmount: number
  netAmount: number
  advancePaid: number
  balance: number
}

interface Payment {
  id: string
  fromParticipantId: string
  status: string
  proofImageUrl: string | null
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

function PaymentStatusBadge({ status, hasRecord }: { status: string; hasRecord: boolean }) {
  if (status === 'confirmed') return <span className="badge badge-settled">✅ Paid</span>
  if (status === 'rejected') return <span className="badge badge-rejected">❌ Rejected</span>
  if (status === 'proof_submitted') return <span className="badge badge-proof">📎 Proof sent</span>
  if (status === 'pending' && hasRecord) return <span className="badge badge-proof">💸 Marked paid</span>
  return null
}

export default function BillDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [bill, setBill] = useState<Bill | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [shares, setShares] = useState<Share[]>([])
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, string>>({})
  const [paymentIds, setPaymentIds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [billRes, summaryRes] = await Promise.all([
        fetch(`/api/bills/${slug}`),
        fetch(`/api/bills/${slug}/summary`),
      ])

      if (!billRes.ok || !summaryRes.ok) return

      const billData = await billRes.json()
      const summaryData = await summaryRes.json()

      setBill(billData.bill)
      setParticipants(billData.participants)
      setShares(summaryData.shares)

      // Build payment status map from payments
      const paymentsRes = await fetch(`/api/bills/${slug}/payments`)
      if (paymentsRes.ok) {
        const paymentsData: Payment[] = await paymentsRes.json()
        const statusMap: Record<string, string> = {}
        const idMap: Record<string, string> = {}
        for (const p of billData.participants) {
          const payment = paymentsData.find((pay: Payment) => pay.fromParticipantId === p.id)
          statusMap[p.id] = payment?.status ?? 'pending'
          if (payment) idMap[p.id] = payment.id
        }
        setPaymentStatuses(statusMap)
        setPaymentIds(idMap)
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleConfirm = async (participantId: string) => {
    const paymentId = paymentIds[participantId]
    if (!paymentId) return

    const res = await fetch(`/api/bills/${slug}/payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    if (res.ok) {
      setPaymentStatuses((prev) => ({ ...prev, [participantId]: 'confirmed' }))
    }
  }

  const handleReject = async (participantId: string) => {
    const paymentId = paymentIds[participantId]
    if (!paymentId) return

    const res = await fetch(`/api/bills/${slug}/payments/${paymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    if (res.ok) {
      setPaymentStatuses((prev) => ({ ...prev, [participantId]: 'rejected' }))
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/bills/${slug}`
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <span className="text-5xl animate-bounce inline-block">🍜</span>
        <p className="text-[#6B7280] font-semibold mt-4">Loading bill...</p>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <span className="text-5xl">😵</span>
        <p className="text-[#6B7280] font-semibold mt-4">Bill not found</p>
        <Link href="/dashboard" className="btn-doodle btn-coral mt-4 inline-block">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const totalAmount = shares.reduce((sum, s) => sum + s.netAmount, 0)
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
          {bill.title}
        </h1>
      </div>

      <div className="flex items-center gap-3 ml-9 mb-4 text-sm text-[#6B7280]">
        {bill.restaurantName && <span>📍 {bill.restaurantName}</span>}
        <StatusBadge status={bill.status} />
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

      {shares.length === 0 ? (
        <div className="doodle-card-sm p-4 text-center mb-6">
          <p className="text-[#6B7280] font-semibold">No participants yet. Share the link!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {shares.map((share, i) => {
            const participant = participants.find((p) => p.id === share.participantId)
            const payStatus = paymentStatuses[share.participantId] ?? 'pending'

            const discountTypeLabel = (type: string | null) => {
              if (type === 'pwd') return <span className="badge" style={{ background: '#C4B5FD' }}>🦽 PWD</span>
              if (type === 'senior') return <span className="badge" style={{ background: '#C4B5FD' }}>🧓 Senior</span>
              return null
            }

            return (
              <div
                key={share.participantId}
                className={`doodle-card-sm p-3 ${rotations[i % 2]}`}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{share.displayName}</span>
                    {participant && discountTypeLabel(participant.discountType)}
                  </div>
                  <PaymentStatusBadge status={payStatus} hasRecord={!!paymentIds[share.participantId]} />
                </div>

                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <span className="text-sm font-semibold text-[#6B7280]">
                    {share.balance > 0
                      ? `owes ${fmt(share.balance)}`
                      : share.balance < 0
                      ? `paid ${fmt(Math.abs(share.balance))} upfront`
                      : 'settled ✓'}
                  </span>

                  <div className="flex items-center gap-2">
                    {(payStatus === 'proof_submitted' || (payStatus === 'pending' && !!paymentIds[share.participantId])) && (
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
                    {payStatus === 'pending' && !paymentIds[share.participantId] && share.balance > 0 && (
                      <span className="text-xs text-[#9CA3AF] font-semibold">awaiting payment</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

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
          {participants.length} participants · {bill.currency}
          {bill.vatRegistered ? ' · VAT Registered' : ''}
        </p>
      </div>
    </div>
  )
}
