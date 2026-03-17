'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import type { FormEvent } from 'react'

interface Bill {
  id: string
  slug: string
  title: string
  restaurantName: string | null
  currency: string
  status: string
}

interface Participant {
  id: string
  displayName: string
  discountType: string | null
}

interface BillItem {
  id: string
  name: string
  price: number
  assignedTo: string[]
}

interface PaymentMethodData {
  id: string
  type: string
  label: string
  accountDetails: string | null
  qrImageUrl: string | null
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

type Step = 'loading' | 'join' | 'details' | 'pay' | 'uploaded' | 'error'

function fmt(centavos: number): string {
  return '₱' + (centavos / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function ParticipantBillPage() {
  const { slug } = useParams<{ slug: string }>()
  const [step, setStep] = useState<Step>('loading')
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')

  // Bill data loaded on mount
  const [bill, setBill] = useState<Bill | null>(null)
  const [existingParticipants, setExistingParticipants] = useState<Participant[]>([])
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])

  // Matched participant
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState('')
  const [myShare, setMyShare] = useState<Share | null>(null)
  const [payError, setPayError] = useState('')

  // Mark-as-paid flow
  const [confirming, setConfirming] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Load bill data on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bills/${slug}`)
        if (!res.ok) { setStep('error'); return }
        const data = await res.json()
        setBill(data.bill)
        setExistingParticipants(data.participants)
        setBillItems(data.items)
        setPaymentMethods(data.paymentMethods)
        setStep('join')
      } catch {
        setStep('error')
      }
    }
    load()
  }, [slug])

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleJoin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = nameInput.trim()
    if (!name) return

    setError('')

    // Validate against the organizer's roster (case-insensitive)
    const match = existingParticipants.find(
      (p) => p.displayName.toLowerCase() === name.toLowerCase()
    )

    if (!match) {
      setError("Your name isn't on this bill. Ask the organizer to add you.")
      return
    }

    // Fetch the summary to get this participant's share
    setStep('loading')
    try {
      const res = await fetch(`/api/bills/${slug}/summary`)
      if (!res.ok) throw new Error('Failed to load summary')
      const data = await res.json()
      const share = data.shares.find((s: Share) => s.participantId === match.id)

      setParticipantId(match.id)
      setParticipantName(match.displayName)
      setMyShare(share ?? null)
      setStep('details')
    } catch {
      setError('Failed to load your share. Please try again.')
      setStep('join')
    }
  }

  const handleMarkAsPaid = () => {
    setConfirming(true)
    setCooldown(5)
  }

  const handleConfirmPayment = async () => {
    if (!participantId || cooldown > 0 || submitting) return
    setSubmitting(true)
    setPayError('')

    try {
      const formData = new FormData()
      formData.append('fromParticipantId', participantId)
      formData.append('toParticipantId', participantId)
      formData.append('amount', String(myShare?.balance ?? 0))
      formData.append('method', paymentMethods[0]?.type ?? 'gcash')

      const res = await fetch(`/api/bills/${slug}/payments`, {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        setStep('uploaded')
      } else {
        setPayError('Failed to mark as paid. Please try again.')
        setConfirming(false)
      }
    } catch {
      setPayError('Network error. Please try again.')
      setConfirming(false)
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
        <div className="text-center">
          <span className="text-5xl animate-bounce inline-block">🍜</span>
          <p className="text-[#6B7280] font-semibold mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FFFBF5]">
        <div className="doodle-card p-8 w-full max-w-sm text-center">
          <span className="text-5xl">😵</span>
          <p className="font-bold mt-3">Bill not found</p>
          <p className="text-sm text-[#6B7280] mt-1">Check the link and try again.</p>
        </div>
      </div>
    )
  }

  // ─── Join form ──────────────────────────────────────────────────────────────
  if (step === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FFFBF5]">
        <div className="doodle-card p-8 w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <span className="text-6xl">🍜</span>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            {bill?.title ?? 'Join this bill'}
          </h1>
          {bill?.restaurantName && (
            <p className="text-[#6B7280] text-sm font-semibold">📍 {bill.restaurantName}</p>
          )}
          <p className="text-[#6B7280] text-sm font-semibold">
            Enter your name to see your share
          </p>
          {error && (
            <p className="text-sm font-bold text-[#FF6B6B]">{error}</p>
          )}
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-3 mt-1">
            <input
              className="input-doodle"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
            <button type="submit" className="btn-doodle btn-coral w-full">
              See my share →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ─── Details + payment ──────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          {bill?.title}
        </h1>
        <p className="text-lg font-semibold text-[#6B7280] mt-0.5">
          👋 Hey {participantName}!
        </p>
      </div>

      {/* Your share card */}
      <div className="doodle-card p-6 mb-4 text-center rotate-[-0.4deg]">
        <p className="text-sm font-bold text-[#6B7280] uppercase tracking-wide mb-1">Your share</p>
        <p
          className="text-5xl font-bold"
          style={{ color: '#FF6B6B', fontFamily: 'var(--font-caveat)' }}
        >
          {myShare ? fmt(myShare.balance) : '₱0.00'}
        </p>
      </div>

      {/* Items breakdown */}
      <div className="doodle-card p-4 mb-4 rotate-[0.3deg]">
        <h2
          className="text-lg font-bold mb-3"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          🛒 Items
        </h2>
        <div className="flex flex-col gap-2">
          {billItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="font-semibold">{item.name}</span>
              <span className="font-bold">{fmt(item.price)}</span>
            </div>
          ))}
          {myShare && myShare.discountAmount > 0 && (
            <>
              <hr className="doodle-divider" />
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold" style={{ color: '#C4B5FD' }}>
                  🎉 Discount applied
                </span>
                <span className="font-bold" style={{ color: '#C4B5FD' }}>
                  -{fmt(myShare.discountAmount)}
                </span>
              </div>
            </>
          )}
          <hr className="doodle-divider" />
          <div className="flex justify-between items-center font-bold">
            <span>Total</span>
            <span>{myShare ? fmt(myShare.netAmount) : '₱0.00'}</span>
          </div>
        </div>
      </div>

      {/* Payment section */}
      {step === 'details' && myShare && myShare.balance > 0 && (
        <button
          onClick={() => setStep('pay')}
          className="btn-doodle btn-coral w-full"
        >
          Pay Now 💸
        </button>
      )}

      {step === 'details' && myShare && myShare.balance <= 0 && (
        <div
          className="doodle-card p-5 text-center mt-4 rotate-[0.3deg]"
          style={{ background: '#6BCB77' }}
        >
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            🎉 You&apos;re all settled!
          </p>
        </div>
      )}

      {step === 'pay' && (
        <div className="doodle-card p-4 mt-4 rotate-[-0.3deg]">
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            💳 Payment method
          </h2>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-[#6B7280] font-semibold mb-3">
              No payment methods set up yet. Contact the organizer.
            </p>
          ) : (
            paymentMethods.map((method) => (
              <div key={method.id} className="doodle-card-sm p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">
                    {method.type === 'gcash' ? '💚' : method.type === 'maya' ? '💜' : method.type === 'bank' ? '🏦' : '💵'}
                  </span>
                  <span className="font-bold">{method.label}</span>
                </div>
                {method.accountDetails && (
                  <p className="text-sm text-[#6B7280] font-semibold">{method.accountDetails}</p>
                )}
                {method.qrImageUrl && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={method.qrImageUrl}
                      alt={`QR code for ${method.label}`}
                      className="w-48 h-48 object-contain rounded-lg border-2 border-[#1C1C1C]"
                    />
                  </div>
                )}
              </div>
            ))
          )}

          {payError && <p className="text-sm font-bold text-[#FF6B6B] mb-3">{payError}</p>}

          {!confirming ? (
            <button
              onClick={handleMarkAsPaid}
              className="btn-doodle btn-yellow w-full"
            >
              Mark as Paid 💸
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-[#6B7280] font-semibold text-center">
                Please confirm you&apos;ve sent the payment
              </p>
              <button
                onClick={handleConfirmPayment}
                disabled={cooldown > 0 || submitting}
                className="btn-doodle w-full transition-all"
                style={{
                  background: cooldown > 0 ? '#E5E7EB' : '#6BCB77',
                  color: cooldown > 0 ? '#9CA3AF' : '#fff',
                  cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  borderColor: cooldown > 0 ? '#D1D5DB' : '#1C1C1C',
                }}
              >
                {submitting
                  ? '✓ Confirming...'
                  : cooldown > 0
                  ? `Confirm Payment (${cooldown}s)`
                  : '✅ Confirm Payment'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'uploaded' && (
        <div
          className="doodle-card p-5 text-center mt-4 rotate-[0.3deg]"
          style={{ background: '#6BCB77' }}
        >
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            ✅ Successfully Paid!
          </p>
          <p className="text-white font-semibold text-sm mt-1">
            The organizer will confirm your payment shortly.
          </p>
        </div>
      )}
    </div>
  )
}
