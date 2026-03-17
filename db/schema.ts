import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core'

// ----------------------------------------------------------------
// users
// ----------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(),            // Clerk user ID
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  defaultCurrency: text('default_currency').notNull().default('PHP'),
  defaultSplitMethod: text('default_split_method').notNull().default('equal'),
  discountAutoCompute: boolean('discount_auto_compute').notNull().default(true),
  billExpiry: integer('bill_expiry'),     // days; null = never
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ----------------------------------------------------------------
// bills
// ----------------------------------------------------------------
export const bills = pgTable('bills', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),  // UUID v4 for shareable URL
  title: text('title').notNull(),
  restaurantName: text('restaurant_name'),
  currency: text('currency').notNull().default('PHP'),
  defaultSplitMethod: text('default_split_method').notNull().default('equal'),
  vatRegistered: boolean('vat_registered').notNull().default(true),
  status: text('status').notNull().default('open'),
  organizerId: text('organizer_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ----------------------------------------------------------------
// participants
// ----------------------------------------------------------------
export const participants = pgTable('participants', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  userId: text('user_id'),                // null for guests
  discountType: text('discount_type'),    // 'pwd' | 'senior' | null
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
})

// ----------------------------------------------------------------
// items
// ----------------------------------------------------------------
export const items = pgTable('items', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: integer('price').notNull(),      // centavos, VAT-inclusive
  assignedTo: jsonb('assigned_to').notNull().default([]), // string[] of participant IDs
  discountEligible: boolean('discount_eligible').notNull().default(true),
  source: text('source').notNull().default('manual'), // 'manual' | 'scan'
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ----------------------------------------------------------------
// discount_overrides
// ----------------------------------------------------------------
export const discountOverrides = pgTable('discount_overrides', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  overrideAmount: integer('override_amount').notNull(), // centavos
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ----------------------------------------------------------------
// advance_payments
// ----------------------------------------------------------------
export const advancePayments = pgTable('advance_payments', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  participantId: text('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),    // centavos
  note: text('note'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ----------------------------------------------------------------
// payment_methods
// ----------------------------------------------------------------
export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),           // 'gcash' | 'maya' | 'bank' | 'cash'
  label: text('label').notNull(),
  accountDetails: text('account_details'),
  qrImageUrl: text('qr_image_url'),
  displayOrder: integer('display_order').notNull().default(0),
})

// ----------------------------------------------------------------
// payments
// ----------------------------------------------------------------
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  fromParticipantId: text('from_participant_id').notNull().references(() => participants.id),
  toParticipantId: text('to_participant_id').notNull().references(() => participants.id),
  amount: integer('amount').notNull(),    // centavos
  method: text('method').notNull(),
  proofImageUrl: text('proof_image_url'),
  status: text('status').notNull().default('pending'),
  rejectionNote: text('rejection_note'),
  confirmedBy: text('confirmed_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
