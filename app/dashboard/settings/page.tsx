'use client'

import { useState } from 'react'
import type { ChangeEvent } from 'react'

type Currency = 'PHP' | 'USD' | 'SGD' | 'HKD'
type SplitMethod = 'equal' | 'byitem'
type DiscountMode = 'auto' | 'manual'
type PaymentType = 'gcash' | 'maya' | 'bank' | 'cash'

export default function SettingsPage() {
  const [currency, setCurrency] = useState<Currency>('PHP')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [discountMode, setDiscountMode] = useState<DiscountMode>('auto')
  const [paymentLabel, setPaymentLabel] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('gcash')
  const [paymentDetails, setPaymentDetails] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const rotations = ['rotate-[-0.4deg]', 'rotate-[0.4deg]']

  const toggleBase =
    'btn-doodle text-sm flex-1'
  const activeToggle = `${toggleBase} btn-coral`
  const inactiveToggle = `${toggleBase} btn-ghost`

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1
        className="text-3xl font-bold mb-6"
        style={{ fontFamily: 'var(--font-caveat)' }}
      >
        ⚙️ Settings
      </h1>

      {/* Toast */}
      {saved && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 doodle-card px-5 py-3 flex items-center gap-2 text-sm font-bold"
          style={{ background: '#6BCB77', color: '#fff', animation: 'slideUp 0.3s ease' }}
        >
          ✅ Saved!
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Currency */}
        <div className={`doodle-card p-4 ${rotations[0]}`}>
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            💱 Default Currency
          </h2>
          <select
            className="input-doodle"
            value={currency}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value as Currency)}
          >
            <option value="PHP">🇵🇭 PHP — Philippine Peso</option>
            <option value="USD">🇺🇸 USD — US Dollar</option>
            <option value="SGD">🇸🇬 SGD — Singapore Dollar</option>
            <option value="HKD">🇭🇰 HKD — Hong Kong Dollar</option>
          </select>
        </div>

        {/* Split method */}
        <div className={`doodle-card p-4 ${rotations[1]}`}>
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            ✂️ Default Split
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSplitMethod('equal')}
              className={splitMethod === 'equal' ? activeToggle : inactiveToggle}
            >
              Equal 🤝
            </button>
            <button
              onClick={() => setSplitMethod('byitem')}
              className={splitMethod === 'byitem' ? activeToggle : inactiveToggle}
            >
              By item 🛒
            </button>
          </div>
        </div>

        {/* Discount mode */}
        <div className={`doodle-card p-4 ${rotations[0]}`}>
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            🏷️ Discount mode
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setDiscountMode('auto')}
              className={discountMode === 'auto' ? activeToggle : inactiveToggle}
            >
              Auto ✨
            </button>
            <button
              onClick={() => setDiscountMode('manual')}
              className={discountMode === 'manual' ? activeToggle : inactiveToggle}
            >
              Manual ✏️
            </button>
          </div>
        </div>

        {/* Payment details */}
        <div className={`doodle-card p-4 ${rotations[1]}`}>
          <h2
            className="text-lg font-bold mb-3"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            💳 My payment details
          </h2>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap mb-3">
            {(
              [
                { value: 'gcash', label: 'GCash 💚' },
                { value: 'maya', label: 'Maya 💜' },
                { value: 'bank', label: 'Bank 🏦' },
                { value: 'cash', label: 'Cash 💵' },
              ] as { value: PaymentType; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPaymentType(value)}
                className={
                  paymentType === value
                    ? 'btn-doodle btn-coral text-xs'
                    : 'btn-doodle btn-ghost text-xs'
                }
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Label input */}
          <div className="mb-3">
            <label className="block text-sm font-bold mb-1">Label</label>
            <input
              className="input-doodle"
              placeholder={`e.g. My ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}`}
              value={paymentLabel}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPaymentLabel(e.target.value)}
            />
          </div>

          {/* Account details — hidden for cash */}
          {paymentType !== 'cash' && (
            <div>
              <label className="block text-sm font-bold mb-1">
                {paymentType === 'bank' ? 'Account number' : 'Mobile number / account'}
              </label>
              <input
                className="input-doodle"
                placeholder={paymentType === 'bank' ? 'e.g. 1234-5678-9012' : 'e.g. 0917-123-4567'}
                value={paymentDetails}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPaymentDetails(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="btn-doodle btn-coral w-full text-base"
        >
          💾 Save settings
        </button>
      </div>
    </div>
  )
}
