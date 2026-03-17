/**
 * Split & Discount Engine — pure functions, no I/O, fully testable.
 * All amounts in centavos (integer) to avoid floating-point errors.
 */

import type { Item, Participant, ParticipantShare, DiscountType } from '@/types/mistika'

// ----------------------------------------------------------------
// Discount computation
// ----------------------------------------------------------------

const VAT_DIVISOR = 1.12
const DISCOUNT_RATE = 0.8

/**
 * Compute the discounted price for one item assigned to a cardholder.
 * @param price - VAT-inclusive price in centavos
 * @param vatRegistered - whether the establishment is VAT-registered
 */
export function computeDiscount(price: number, vatRegistered: boolean): number {
  if (vatRegistered) {
    // Remove VAT, then apply 20% discount
    return Math.round(price - (price / VAT_DIVISOR) * DISCOUNT_RATE)
  }
  // Non-VAT: flat 20% off
  return Math.round(price * 0.2)
}

/**
 * Compute the discounted price for a cardholder's PORTION of a shared item.
 * @param fullPrice - full item price in centavos
 * @param totalAssigned - how many participants share this item
 * @param vatRegistered - whether the establishment is VAT-registered
 */
export function computeDiscountOnShare(
  fullPrice: number,
  totalAssigned: number,
  vatRegistered: boolean,
): number {
  const share = Math.round(fullPrice / totalAssigned)
  return computeDiscount(share, vatRegistered)
}

// ----------------------------------------------------------------
// Share allocation
// ----------------------------------------------------------------

interface OverrideMap {
  // key: `${itemId}:${participantId}`
  [key: string]: number // centavos override amount
}

interface AdvanceMap {
  // key: participantId
  [participantId: string]: number // centavos
}

interface ComputeSharesInput {
  items: Item[]
  participants: Participant[]
  vatRegistered: boolean
  advancePayments: AdvanceMap
  discountOverrides: OverrideMap
}

/**
 * Main computation: returns a ParticipantShare for every participant.
 *
 * Rules:
 * - item.assignedTo = [] means all participants share it equally
 * - discount applies only to cardholder's own portion, not others' shares
 * - rounding remainder on equal splits goes to the first participant
 */
export function computeShares({
  items,
  participants,
  vatRegistered,
  advancePayments,
  discountOverrides,
}: ComputeSharesInput): ParticipantShare[] {
  // Build lookup maps
  const participantMap = new Map(participants.map((p) => [p.id, p]))

  const gross: Record<string, number> = {}
  const discount: Record<string, number> = {}
  const overridden: Record<string, boolean> = {}

  for (const p of participants) {
    gross[p.id] = 0
    discount[p.id] = 0
    overridden[p.id] = false
  }

  for (const item of items) {
    const assigned = item.assignedTo.length > 0
      ? item.assignedTo.filter((id) => participantMap.has(id))
      : participants.map((p) => p.id)

    const n = assigned.length
    if (n === 0) continue

    const baseShare = Math.floor(item.price / n)
    const remainder = item.price - baseShare * n

    assigned.forEach((pid, idx) => {
      const share = baseShare + (idx === 0 ? remainder : 0)
      gross[pid] = (gross[pid] ?? 0) + share

      const participant = participantMap.get(pid)
      if (!participant?.discountType || !item.discountEligible) return

      const overrideKey = `${item.id}:${pid}`
      if (discountOverrides[overrideKey] !== undefined) {
        discount[pid] = (discount[pid] ?? 0) + discountOverrides[overrideKey]
        overridden[pid] = true
      } else {
        discount[pid] = (discount[pid] ?? 0) + computeDiscountOnShare(item.price, n, vatRegistered)
      }
    })
  }

  return participants.map((p) => {
    const g = gross[p.id] ?? 0
    const d = discount[p.id] ?? 0
    const advance = advancePayments[p.id] ?? 0
    const net = g - d
    const balance = net - advance

    return {
      participantId: p.id,
      displayName: p.displayName,
      grossAmount: g,
      discountAmount: d,
      netAmount: net,
      advancePaid: advance,
      balance,
      discountOverridden: overridden[p.id] ?? false,
    }
  })
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Convert centavos to a display string: 12345 → "123.45" */
export function centavosToDisplay(centavos: number): string {
  return (centavos / 100).toFixed(2)
}

/** Parse a peso string to centavos: "1,234.50" → 123450 */
export function pesosToCentavos(value: string): number {
  const cleaned = value.replace(/,/g, '').trim()
  return Math.round(parseFloat(cleaned) * 100)
}

/** Check if all shares are settled (balance <= 0 or confirmed payments cover them) */
export function isBillSettled(shares: ParticipantShare[]): boolean {
  return shares.every((s) => s.balance <= 0)
}
