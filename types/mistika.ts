// ============================================================
// Mistika — Shared Types
// All amounts are stored in centavos (integer) to avoid float math.
// ============================================================

export type SplitMethod = 'equal' | 'item'
export type DiscountType = 'pwd' | 'senior'
export type BillStatus = 'open' | 'settling' | 'settled' | 'archived'
export type PaymentMethodType = 'gcash' | 'maya' | 'bank' | 'cash'
export type PaymentStatus = 'pending' | 'proof_submitted' | 'confirmed' | 'rejected'
export type ItemSource = 'manual' | 'scan'
export type ScanConfidence = 'high' | 'medium' | 'low'

// ----------------------------------------------------------------
// Database-backed entities
// ----------------------------------------------------------------

export interface User {
  id: string              // Clerk user ID
  email: string
  displayName: string
  defaultCurrency: string
  defaultSplitMethod: SplitMethod
  discountAutoCompute: boolean
  billExpiry: number | null   // days; null = never
  createdAt: Date
}

export interface Bill {
  id: string
  slug: string            // UUID v4, used in URLs
  title: string
  restaurantName: string | null
  currency: string        // ISO 4217 e.g. 'PHP'
  defaultSplitMethod: SplitMethod
  vatRegistered: boolean
  status: BillStatus
  organizerId: string     // Clerk user ID
  createdAt: Date
  updatedAt: Date
}

export interface Participant {
  id: string
  billId: string
  displayName: string
  userId: string | null   // null for guests
  discountType: DiscountType | null
  joinedAt: Date
}

export interface Item {
  id: string
  billId: string
  name: string
  price: number           // centavos, VAT-inclusive
  assignedTo: string[]    // participant IDs; empty array = all participants
  discountEligible: boolean
  source: ItemSource
  createdAt: Date
}

export interface PaymentMethod {
  id: string
  billId: string
  type: PaymentMethodType
  label: string           // e.g. "Bea's GCash"
  accountDetails: string | null
  qrImageUrl: string | null   // Vercel Blob URL
  displayOrder: number
}

export interface AdvancePayment {
  id: string
  billId: string
  participantId: string
  amount: number          // centavos
  note: string | null
  createdAt: Date
}

export interface Payment {
  id: string
  billId: string
  fromParticipantId: string
  toParticipantId: string
  amount: number          // centavos
  method: PaymentMethodType
  proofImageUrl: string | null
  status: PaymentStatus
  rejectionNote: string | null
  confirmedBy: string | null  // userId of confirmer
  createdAt: Date
  updatedAt: Date
}

// ----------------------------------------------------------------
// Computed (not stored in DB)
// ----------------------------------------------------------------

export interface ParticipantShare {
  participantId: string
  displayName: string
  grossAmount: number       // centavos, before discount
  discountAmount: number    // centavos, total discount applied
  netAmount: number         // centavos, after discount
  advancePaid: number       // centavos, already paid upfront
  balance: number           // centavos; positive = owes, negative = owed back
  discountOverridden: boolean
}

export interface BillSummary {
  bill: Bill
  participants: Participant[]
  items: Item[]
  paymentMethods: PaymentMethod[]
  shares: ParticipantShare[]
  totalAmount: number       // centavos, sum of all items
  settledCount: number
  totalParticipants: number
}

// ----------------------------------------------------------------
// Discount override (Organizer manually adjusts auto-computed discount)
// ----------------------------------------------------------------

export interface DiscountOverride {
  id: string
  billId: string
  itemId: string
  participantId: string
  overrideAmount: number    // centavos; replaces computed discount
  createdAt: Date
}

// ----------------------------------------------------------------
// Receipt scanning
// ----------------------------------------------------------------

export interface ScannedItem {
  name: string
  price: number             // centavos
  quantity: number | null
  confidence: ScanConfidence
}

export interface ScanResult {
  items: ScannedItem[]
  warnings: string[]
  error: 'blurry' | 'no_items' | 'partial' | 'parse_error' | null
}

// ----------------------------------------------------------------
// API request/response shapes
// ----------------------------------------------------------------

export interface CreateBillRequest {
  title: string
  restaurantName?: string
  currency?: string
  defaultSplitMethod?: SplitMethod
  vatRegistered?: boolean
}

export interface AddParticipantRequest {
  displayName: string
  discountType?: DiscountType | null
}

export interface AddItemRequest {
  name: string
  price: number             // centavos
  assignedTo?: string[]     // participant IDs; omit = all
  discountEligible?: boolean
  source?: ItemSource
}

export interface AddPaymentMethodRequest {
  type: PaymentMethodType
  label: string
  accountDetails?: string
  // qrImage is sent as multipart field
}

export interface CreatePaymentRequest {
  fromParticipantId: string
  toParticipantId: string
  amount: number            // centavos
  method: PaymentMethodType
  // proofImage is sent as multipart field; omit for cash/manual
}

export interface UpdatePaymentRequest {
  status: 'confirmed' | 'rejected'
  rejectionNote?: string
}

export interface ApiError {
  error: string
  code?: string
}
