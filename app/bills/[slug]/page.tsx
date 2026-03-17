'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

const mockBill = {
  title: 'Dinner at Manam 🍖',
  restaurantName: 'Manam',
  currency: 'PHP',
}

const mockShare = {
  displayName: 'Carlo',
  grossAmount: 48000,
  discountAmount: 0,
  netAmount: 48000,
  advancePaid: 0,
  balance: 48000,
}

const mockItems = [
  { id: 'i1', name: 'Crispy Dinuguan', price: 38500, assignedTo: [] as string[] },
  { id: 'i2', name: 'Sizzling Sinigang', price: 52000, assignedTo: ['p2'] },
  { id: 'i3', name: 'Plain Rice ×5', price: 15000, assignedTo: [] as string[] },
]

const mockPaymentMethods = [
  {
    id: 'm1',
    type: 'gcash',
    label: "Bea's GCash",
    accountDetails: '0917-123-4567',
    qrImageUrl: null as string | null,
  },
]

type PaymentStep = 'none' | 'details' | 'uploaded'

function fmt(centavos: number): string {
  return '₱' + (centavos / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function ParticipantBillPage() {
  const [nameEntered, setNameEntered] = useState(false)
  const [name, setName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('none')
  const [proofUploaded, setProofUploaded] = useState(false)

  const handleJoin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (nameInput.trim()) {
      setName(nameInput.trim())
      setNameEntered(true)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofUploaded(true)
      setPaymentStep('uploaded')
    }
  }

  if (!nameEntered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FFFBF5]">
        <div className="doodle-card p-8 w-full max-w-sm flex flex-col items-center gap-4 text-center">
          <span className="text-6xl">🍜</span>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            Join this bill
          </h1>
          <p className="text-[#6B7280] text-sm font-semibold">
            Enter your name to see your share
          </p>
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

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: 'var(--font-caveat)' }}
        >
          {mockBill.title}
        </h1>
        <p className="text-lg font-semibold text-[#6B7280] mt-0.5">
          👋 Hey {name}!
        </p>
      </div>

      {/* Your share card */}
      <div className="doodle-card p-6 mb-4 text-center rotate-[-0.4deg]">
        <p className="text-sm font-bold text-[#6B7280] uppercase tracking-wide mb-1">Your share</p>
        <p
          className="text-5xl font-bold"
          style={{ color: '#FF6B6B', fontFamily: 'var(--font-caveat)' }}
        >
          {fmt(mockShare.balance)}
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
          {mockItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm">
              <span className="font-semibold">{item.name}</span>
              <span className="font-bold">{fmt(item.price)}</span>
            </div>
          ))}
          {mockShare.discountAmount > 0 && (
            <>
              <hr className="doodle-divider" />
              <div className="flex justify-between items-center text-sm">
                <span
                  className="font-bold"
                  style={{ color: '#C4B5FD' }}
                >
                  🎉 Discount applied
                </span>
                <span className="font-bold" style={{ color: '#C4B5FD' }}>
                  -{fmt(mockShare.discountAmount)}
                </span>
              </div>
            </>
          )}
          <hr className="doodle-divider" />
          <div className="flex justify-between items-center font-bold">
            <span>Total</span>
            <span>{fmt(mockShare.netAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment section */}
      {!proofUploaded && paymentStep === 'none' && (
        <button
          onClick={() => setPaymentStep('details')}
          className="btn-doodle btn-coral w-full"
        >
          Pay Now 💸
        </button>
      )}

      {paymentStep === 'details' && !proofUploaded && (
        <div className="doodle-card p-4 mt-4 rotate-[-0.3deg]">
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            💳 Payment method
          </h2>
          {mockPaymentMethods.map((method) => (
            <div key={method.id} className="doodle-card-sm p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">
                  {method.type === 'gcash' ? '💚' : method.type === 'maya' ? '💜' : '💳'}
                </span>
                <span className="font-bold">{method.label}</span>
              </div>
              <p className="text-sm text-[#6B7280] font-semibold">{method.accountDetails}</p>
            </div>
          ))}
          <label className="btn-doodle btn-yellow w-full cursor-pointer flex items-center justify-center gap-2">
            Upload proof 📎
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {proofUploaded && (
        <div
          className="doodle-card p-5 text-center mt-4 rotate-[0.3deg]"
          style={{ background: '#6BCB77' }}
        >
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            🎉 Proof submitted!
          </p>
          <p className="text-white font-semibold text-sm mt-1">
            Waiting for confirmation.
          </p>
        </div>
      )}
    </div>
  )
}
