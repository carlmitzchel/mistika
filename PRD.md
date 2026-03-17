# Product Requirements Document
## Mistika — Expense Splitter for Groups

**Version:** 1.1
**Date:** March 17, 2026
**Status:** Draft

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Users](#2-target-users)
3. [Problem Statement](#3-problem-statement)
4. [Goals and Non-Goals](#4-goals-and-non-goals)
5. [Core Features](#5-core-features)
6. [User Flows](#6-user-flows)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Edge Cases](#9-edge-cases)
10. [Assumptions](#10-assumptions)
11. [MVP Scope vs Future Enhancements](#11-mvp-scope-vs-future-enhancements)
12. [Success Metrics](#12-success-metrics)

---

## 1. Product Overview

**Mistika** is a mobile-first web application that simplifies splitting bills and tracking payments within a group. It is designed primarily for casual use — groups eating out together, splitting groceries, or sharing travel costs.

The app allows one person (the Organizer) to create a bill, assign items or shares to participants, apply Philippine-specific discounts (PWD/Senior Citizen), and coordinate payment settlement via e-wallet or cash — all without requiring participants to register an account.

### Tagline
*"Eat then split!"*

---

## 2. Target Users

### Primary Market
Filipino consumers aged 18–40, dining out or splitting shared expenses in groups of 2–12 people.

---

### Persona 1 — The Organizer
**Name:** Bea, 27, Marketing Manager, Makati
**Device:** iPhone, mobile data
**Context:** Goes out with work colleagues every Friday. Always ends up being the one who pays first, then chases people for money via GCash.
**Pain points:**
- Has to manually compute each person's share, including VAT and service charge
- Forgets who already sent their GCash
- Awkward to keep following up on unpaid shares
**Goal:** Create a split quickly at the table, share a link, confirm payments as they come in.

---

### Persona 2 — The Participant (With Account)
**Name:** Carlo, 25, Software Developer, QC
**Context:** Part of Bea's team. Wants to see exactly what he owes without doing math himself.
**Pain points:**
- Doesn't trust mental math splits
- Wants to pay immediately and have a record of it
**Goal:** See his exact share, send GCash, upload proof, done.

---

### Persona 3 — The Participant (Guest / No Account)
**Name:** Ate Linda, 52, HR Assistant
**Context:** Not very tech-savvy. Joined via a link Bea sent in the group chat.
**Pain points:**
- Doesn't want to sign up for another app
- Just wants to know how much she owes
**Goal:** Click the link, enter her name, see her amount, pay.

---

### Persona 4 — The Discount Cardholder
**Name:** Lolo Ben, 68, Retired, Cavite
**Context:** Joins family Sunday lunches. Has a Senior Citizen ID.
**Pain points:**
- His discount is often miscalculated or forgotten entirely
- Sometimes the whole table splits the discount instead of applying it just to him
**Goal:** His share is automatically discounted correctly; no awkward negotiation.

---

## 3. Problem Statement

Group payments in the Philippines suffer from three compounding problems:

### 3.1 Calculation Complexity
- Bills mix individual orders and shared dishes
- PWD and Senior Citizen discounts apply per person and per item, with a specific VAT-exclusion formula
- Service charges and taxes need to be correctly attributed

### 3.2 Payment Fragmentation
- One person pays the full bill upfront
- Collection happens across GCash, Maya, bank transfers, and cash — often in an untracked chat thread
- Partial payments and "bawi na lang next time" commitments are hard to track

### 3.3 Social Friction
- Following up on unpaid shares is awkward, especially with seniors or authority figures
- No neutral system — amounts are debated because there's no shared source of truth

---

## 4. Goals and Non-Goals

### Goals
- Allow an Organizer to create and manage a bill split in under 3 minutes
- Let participants join and view their share without registering an account
- Correctly compute PWD/Senior Citizen discounts per Philippine tax rules
- Coordinate payment settlement with proof-of-payment upload
- Persist bills so Organizers and participants can refer back to them
- Support equal and item-level splits in MVP

### Non-Goals
- **NOT** processing actual financial transactions (no BSP e-money license)
- **NOT** integrating directly with GCash/Maya APIs (no direct disbursement or collection)
- **NOT** managing recurring group expenses (rent, subscriptions) in MVP
- **NOT** multi-currency FX conversion
- **NOT** a general-purpose accounting or budgeting tool

---

## 5. Core Features

### F1 — Bill Creation
- Organizer creates a bill with a title, date, optional restaurant name, and currency
- Chooses a default split method: **Equal** or **Item-level**
- Generates a unique shareable link and QR code

### F2 — Participant Management
- Organizer adds participants by name
- Participants can join via link; enter a display name (no account required)
- Organizer can flag a participant as **PWD** or **Senior Citizen** cardholder

### F3 — Item Entry
- Add items with name and price
- Assign each item to: one person, a subset, or all participants
- Shared items are split equally among assigned participants
- Mark items as discount-eligible or excluded (default: food = eligible, alcohol/tobacco = excluded)

### F4 — Discount Computation (PWD / Senior Citizen)
- Auto-computes: `(price ÷ 1.12) × 0.80` on eligible items for flagged participants
- Organizer can override the computed discounted amount manually
- Discount applies only to the cardholder's assigned items, not the whole bill

### F5 — Bill Summary
- Shows each participant's gross share, discounts applied, and net amount owed
- Shows who paid upfront and what balances remain
- Displays settlement status per participant

### F6 — Payment Coordination
- Organizer enters their e-wallet details (GCash/Maya number, bank account info, or cash instructions)
- Organizer can upload a **QR code image** (e.g., GCash or Maya QR) — displayed to participants on the "Pay Now" screen
- Multiple payment methods can be listed per bill; each can have a QR image and/or text details
- Participant taps "Pay Now" → sees amount owed + payment method(s) including any uploaded QR
- Participant uploads proof of payment (screenshot or photo)
- Organizer (or designated payer) reviews and confirms or rejects proof
- Status per participant: **Pending → Proof Submitted → Confirmed / Rejected**

### F7 — Settlement Tracking
- Net balance view: "X owes Y ₱___"
- Advance payments recorded and deducted from balance
- Manual "Mark as Paid" (for cash or when proof is not needed)

### F8 — Bill Persistence and History
- Bills are saved and accessible via link
- Organizer can view all bills in their account
- Participants with accounts can view their bill history
- Bills can be archived or closed by the Organizer

### F9 — User Settings
- Default currency (default: PHP)
- Default split method
- E-wallet / payment details (text fields + QR image upload per method)
- PWD discount computation: Auto or Manual override preference
- Bill expiry (default: Never)

### F10 — Receipt Scanning (AI Vision)
- Organizer opens camera or uploads a photo of the physical receipt
- Image is sent to an AI vision model (e.g., Claude or GPT-4o with vision) via a server-side API call
- Model extracts: item names, quantities (if shown), and prices
- Result is presented as an **editable item list** before any items are saved:
  - Organizer can rename, correct prices, merge, or delete any extracted item
  - Items with low-confidence extraction are highlighted for review
- After confirmation, extracted items are added to the bill as if manually entered
- Organizer can re-scan or add items manually alongside scanned items

---

## 6. User Flows

### Flow 1 — Organizer Creates a Bill

```
1. Organizer opens app → taps "New Bill"
2. Enters: Bill title, date, restaurant name (optional), currency
3. Selects default split method: Equal / Item-level
4. Adds participants:
   - Types names manually
   - OR shares link/QR for self-join
   - Flags any participant as PWD/Senior Citizen
5. Adds items (if item-level split):
   Option A — Scan Receipt:
     - Taps "Scan Receipt" → opens camera or file picker
     - Captures/uploads photo of physical receipt
     - AI vision model processes image and returns extracted items
     - Organizer reviews editable list:
       * Corrects any misread names or prices
       * Deletes irrelevant lines (e.g., subtotal rows, "THANK YOU")
       * Adds any missing items manually
     - Confirms → items saved to bill
   Option B — Manual Entry:
     - Name + price per item
   Option A and B can be combined (scan first, then add missing items)
   - Assigns each item to: [specific person] / [subset] / [all]
   - Marks item as discount-eligible: Yes/No
6. Reviews bill summary:
   - Sees breakdown per participant
   - Adjusts any discounted amounts if needed
7. Enters payment details:
   - GCash number, Maya number, bank account, or cash instructions
   - Uploads QR code image (optional, per payment method)
8. Taps "Share Bill" → copies link or shows QR
```

---

### Flow 2 — Participant Joins via Link (Guest)

```
1. Participant receives link in chat (Messenger, Viber, etc.)
2. Opens link in browser → sees bill title and total
3. Prompted: "Enter your name to see your share"
4. Enters name → matched to name in Organizer's list (fuzzy match + confirm)
5. Sees: itemized share, discount applied (if any), net amount owed
6. Taps "Pay Now" → sees payment method(s)
7. Completes payment externally (GCash app, etc.)
8. Returns to app → uploads proof of payment screenshot
9. Status shows: "Proof Submitted — waiting for confirmation"
```

---

### Flow 3 — Organizer Confirms Payments

```
1. Organizer receives notification (or checks bill page)
2. Sees list of participants with "Proof Submitted" status
3. Taps participant → views uploaded proof image
4. Taps "Confirm" or "Reject"
   - Confirm → participant status: Settled ✓
   - Reject → participant notified, prompted to resubmit
5. When all participants: Settled → bill shows "Fully Settled"
6. Organizer can archive the bill
```

---

### Flow 4 — PWD/Senior Discount Applied

```
1. Organizer flags "Lolo Ben" as Senior Citizen
2. Organizer adds items and assigns some to Lolo Ben
3. Per assigned item → discount-eligible toggle (default: Yes for food)
4. App computes:
   - Eligible item price: ₱250 (VAT-inclusive)
   - Discounted: (250 ÷ 1.12) × 0.80 = ₱178.57
5. Lolo Ben's share shows:
   - Gross: ₱250.00
   - Discount: -₱71.43
   - Net: ₱178.57
6. Organizer can tap the discount amount to manually override
```

---

### Flow 5 — Equal Split with Advance Payment

```
1. Organizer creates bill: ₱2,400 total, 6 people
2. Split method: Equal → ₱400 each
3. Organizer notes: "I paid the full bill"
4. Records: Organizer paid ₱2,400 upfront
5. App shows balances:
   - 5 participants each owe Organizer ₱400
   - Organizer owes ₱0
6. Each participant follows Pay Now flow
```

---

### Flow 6 — Receipt Scan and Edit

```
1. Organizer taps "Scan Receipt" during item entry
2. Prompted to: [Open Camera] or [Upload Photo]
3. Camera opens (mobile) or file picker appears (desktop)
4. Photo taken or selected → uploaded to server
5. Server sends image to AI vision model API
6. Model returns structured data: [{ name, price, qty }]
7. App shows editable extraction review screen:
   - Each extracted row shown as an editable card
   - Fields: Item Name (text), Price (numeric), Include (toggle)
   - Rows flagged with uncertainty are highlighted in yellow
   - "Add row" button for missing items
   - "Remove" button per row
8. Organizer reviews all rows → taps "Confirm Items"
9. Confirmed items added to bill
10. Organizer proceeds to assign items to participants
```

**Error states:**
- Image too blurry → "We couldn't read this receipt clearly. Try better lighting or a closer shot."
- No items detected → "No items found. You can add them manually."
- Partial extraction → show what was found, prompt user to fill in gaps

---

## 7. Functional Requirements

### Authentication
- FR-01: Organizers must register with email/social login (Google, Apple)
- FR-02: Participants may join a bill without registering, using a display name
- FR-03: Guest participants can claim their bill history if they later create an account (matched by name + bill link)

### Bill Management
- FR-04: Organizer can create, edit, archive, and delete bills they own
- FR-05: Bills are editable until the first payment is confirmed
- FR-06: After first confirmed payment, Organizer must acknowledge a warning to edit
- FR-07: Bill generates a unique URL and QR code on creation
- FR-08: Currency is set at bill creation; display only, no conversion

### Participant Management
- FR-09: Organizer can add/remove participants before any payment is confirmed
- FR-10: Participants join by opening the shareable link and entering their display name
- FR-11: Name matching: system suggests existing participant names on join (Organizer confirms match)
- FR-12: Organizer can flag a participant as PWD or Senior Citizen cardholder

### Item Entry and Assignment
- FR-13: Items have a name and a price (required)
- FR-14: Each item is assigned to: one participant, a named subset, or all participants
- FR-15: Shared items are split equally among their assigned subset
- FR-16: Items have a discount-eligible toggle (default: true for food, false for alcohol/tobacco)
- FR-17: Organizer can change assignment and eligibility until bill is locked

### Discount Logic
- FR-18: When a participant is flagged PWD/Senior Citizen, all their eligible items are discounted
- FR-19: Auto-computed discount formula: `(VAT-inclusive price ÷ 1.12) × 0.80`
- FR-20: Organizer can override the computed discount amount per item per participant
- FR-21: Manual override is flagged visually (e.g., pencil icon + "Manually adjusted")
- FR-22: Discount is applied only to the cardholder's portion of shared items (not other participants' shares)

### Split Methods
- FR-23: Equal split divides the bill total equally among all participants
- FR-24: Item-level split sums each participant's assigned items
- FR-25: Both methods can coexist within one bill (some items equal, some assigned)
- FR-26: Advance payments are recorded and deducted from participant balances

### Payment Coordination
- FR-27: Organizer enters payment details: GCash number, Maya number, bank account, or cash instructions
- FR-28: Multiple payment methods can be listed per bill
- FR-28a: Organizer can upload a QR code image per payment method (JPG, PNG, max 5 MB)
- FR-28b: Uploaded QR is displayed prominently on the participant's "Pay Now" screen
- FR-28c: QR images are stored per bill (not globally) — Organizer can set defaults in user settings
- FR-29: Participants can upload one proof-of-payment image per payment
- FR-30: Accepted formats: JPG, PNG, HEIC (max 10 MB)
- FR-31: Organizer receives in-app notification when proof is submitted
- FR-32: Organizer can confirm or reject submitted proof
- FR-33: Rejected proof returns participant to "Pending" with an optional rejection note
- FR-34: Organizer or designated payer (the person who paid upfront) can confirm payments
- FR-35: "Mark as Paid" manual override available for cash or trust-based confirmation

### Receipt Scanning
- FR-40: Organizer can initiate receipt scanning from the item entry screen
- FR-41: Scanning supports two input modes: camera capture (mobile) and file upload (any device)
- FR-42: Image is sent to an AI vision model via a server-side API call (not processed client-side)
- FR-43: Model returns structured extraction: item name, price, and quantity (where available)
- FR-44: Extraction result is presented as an editable list before any items are committed to the bill
- FR-45: Each extracted row can be edited (name, price), toggled (include/exclude), or deleted
- FR-46: Rows with uncertain extraction are visually flagged (e.g., highlighted border, warning icon)
- FR-47: Organizer can add rows manually within the review screen
- FR-48: After confirmation, items are added to the bill identically to manually entered items
- FR-49: If extraction fails (blurry image, no text detected), a user-friendly error is shown with retry option
- FR-50: Scanned items and manually added items can coexist in the same bill

### Settlement and History
- FR-36: Balances are shown as direct pairings: "X owes Y ₱___"
- FR-37: Bill is marked "Fully Settled" when all participant statuses are Confirmed
- FR-38: Bills are persisted indefinitely unless manually archived or deleted
- FR-39: Organizer's bill list shows: title, date, settlement status, total amount

---

## 8. Non-Functional Requirements

### Performance
- NFR-01: Bill page must load in under 2 seconds on a 4G mobile connection
- NFR-02: Proof image upload must complete within 5 seconds for files under 5 MB

### Availability
- NFR-03: Target 99.5% uptime (suitable for Vercel-hosted app with edge caching)
- NFR-04: Bill links must remain accessible even if the Organizer's account is deactivated (read-only mode)

### Mobile Experience
- NFR-05: All primary flows must be completable on a 375px-wide viewport (iPhone SE)
- NFR-06: Touch targets minimum 44px × 44px
- NFR-07: App must function on Safari (iOS) and Chrome (Android) — primary browsers in PH

### Security
- NFR-08: Bill links include a non-guessable token (UUID v4 or similar)
- NFR-09: Proof-of-payment images are accessible only to the Organizer and the uploader
- NFR-10: No financial data is transmitted — app is a coordination layer only
- NFR-11: User passwords (if applicable) hashed; OAuth preferred

### Localization
- NFR-12: Default locale: Filipino / English (code-switched UI acceptable)
- NFR-13: Currency display respects user-set currency with proper formatting (₱ for PHP)
- NFR-14: Dates in PH format: Month DD, YYYY or DD/MM/YYYY (user-configurable)

### Data Retention
- NFR-15: Bills retained per user settings (default: indefinite)
- NFR-16: Deleted bills are soft-deleted; permanently purged after 30 days

---

## 9. Edge Cases

### Discount Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Participant is flagged Senior Citizen but orders only alcohol | No discount applied (all items ineligible) |
| Two Senior Citizens at the same table | Each gets their own discount independently |
| A shared dish is ordered by one Senior and one non-Senior | Discount applies only to Senior's portion of that shared item |
| Organizer manually overrides discount to ₱0 | Treated as "no discount" — flagged as manual override |
| Establishment is not VAT-registered | Organizer should toggle "Non-VAT registered" → system applies 20% flat discount only (no VAT exclusion) |

### Payment Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Participant uploads wrong screenshot (e.g., empty wallet) | Organizer rejects with note; participant resubmits |
| Organizer paid partial amount upfront; others paid partial too | Record each payer + amount; system computes remaining balances |
| Two participants have the same name | System appends a number (e.g., "Carlo 1", "Carlo 2"); Organizer renames |
| Participant pays the correct amount but to the wrong person | Organizer manually adjusts payment records |
| Participant sends ₱10 more than owed | System shows overpayment; Organizer decides to ignore or note it |
| Participant claims to have paid cash but no proof | Organizer can use "Mark as Paid" manually |

### Bill Editing Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Organizer edits bill after one participant has already paid | Warning shown; edit allowed but confirmed payments are preserved |
| Organizer removes an item that was already paid for | System recalculates; confirmed payment is marked as overpayment |
| Organizer removes a participant who has already paid | Participant removed from bill; their payment is logged as a note |
| Organizer changes split method after items are assigned | Warning: "This will reset item assignments." Requires confirmation |

### Guest Participant Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Guest enters a name that doesn't match any in the Organizer's list | Prompted to confirm or contact Organizer; can still view public bill summary |
| Same guest link shared, two people claim the same name | System alerts Organizer; Organizer resolves by renaming one |
| Guest participant later creates an account | Prompted to link previous bills by matching name + bill link |

### Receipt Scanning Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Receipt is blurry or poorly lit | Error message with retry prompt; fallback to manual entry |
| Receipt has handwritten amounts | Model attempts extraction; low-confidence items flagged for review |
| Subtotal / total / tax rows extracted as items | Organizer deletes them in review; future improvement: model learns to exclude these |
| Two receipts scanned for one bill | Both extractions added to the same review list; duplicates flagged if names match |
| Receipt is in a foreign language | Model extracts what it can; Organizer reviews all rows before confirming |
| Item name extracted correctly but price is wrong (e.g., ₱1,200 read as ₱1.200) | Row highlighted; Organizer corrects price in review screen |
| QR code image in the receipt | Model ignores QR codes in receipts; payment QR is a separate upload by Organizer |

### Payment Method QR Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Organizer uploads a non-QR image as their QR code | No validation in MVP — Organizer is responsible; future improvement: QR detection |
| QR code uploaded is outdated (account closed) | App cannot verify; Organizer is responsible for keeping details current |
| Participant cannot scan QR (no QR scanner) | Text details (account number) are always shown alongside the QR image |

### Calculation Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Bill total doesn't match sum of items (rounding or receipt error) | System shows discrepancy in pesos; Organizer adjusts manually before sharing |
| Service charge added by restaurant | Organizer adds as a line item or enters adjusted total; toggle for "include in split" |
| Equal split results in a non-divisible amount (e.g., ₱100 ÷ 3 = ₱33.33...) | System rounds to 2 decimal places; remainder assigned to Organizer or first participant (configurable) |

---

## 10. Assumptions

1. **No payment processing license is held.** The app coordinates payments but never holds, transfers, or processes money. All transactions happen externally (GCash, Maya, cash).

2. **Philippine tax rules apply by default.** PWD/Senior Citizen discounts are computed per Philippine law (20% + VAT exemption for VAT-registered establishments). Organizer can toggle non-VAT mode.

3. **GCash and Maya do not provide an open API for QR generation** at time of writing. Organizers use their own static QR images (downloaded from GCash/Maya app) and upload them manually. The app displays the image; it does not generate or validate QR codes.

4. **Participants have reliable access to a mobile browser** on their smartphone (Android or iOS). No native app required.

5. **The Organizer is tech-comfortable** — can add items, assign splits, and confirm payments within the app. Participants only need to view their share and upload a screenshot.

6. **Bills are primarily denominated in PHP.** Multi-currency support is for display only — no FX conversion is expected.

7. **Receipt prices shown in the Philippines are VAT-inclusive** unless the establishment is non-VAT registered. Default formula assumes VAT-inclusive input.

8. **Groups are small (2–12 participants).** Performance and UX are designed for this scale. Very large groups (corporate events, weddings) are out of scope for MVP.

---

## 11. MVP Scope vs Future Enhancements

### MVP (v1.0)

**Include:**
- Bill creation with title, currency, date
- Equal split and item-level split
- Participant management (add by name, join via link)
- PWD/Senior Citizen auto-discount with manual override
- Payment coordination: GCash/Maya manual details + QR code image upload + proof upload
- Organizer confirms/rejects proof
- Basic settlement tracking (per-participant status)
- Bill history for Organizer account
- User settings: currency, payment details (with QR upload), discount mode
- **Receipt scanning via AI vision model with editable review step**

**Deliberately excluded from MVP:**
- Percentage-based split (v1.1)
- Debt simplification across multiple bills (v1.1)
- Push/email notifications (v1.1)
- Non-VAT registered toggle (v1.1 — add as settings option)
- Native mobile app (v2.0)
- GCash/Maya deep-link or QR auto-generation (v2.0, pending API access)
- Recurring bills/groups (v2.0)
- In-app reminders and follow-up messages (v2.0)
- Guest account claiming / bill history migration (v1.2)
- Rounding preference settings (v1.1)
- Receipt scanning confidence tuning / model fine-tuning (v2.0)

---

### Versioning Roadmap

| Version | Theme | Key Features |
|---|---|---|
| **v1.0** | Core MVP | Bill creation, item split, discounts, payment coordination, QR upload, receipt scanning |
| **v1.1** | Completeness | Percentage split, notifications, rounding config, non-VAT mode |
| **v1.2** | Social | Guest account claiming, multi-bill group history |
| **v2.0** | Intelligence | Debt graph simplification, GCash integration, receipt model fine-tuning |
| **v3.0** | Platform | Native app, recurring groups, budget tracking |

---

## 12. Success Metrics

### Activation
- **Target:** 70% of Organizers complete at least one bill split within first session
- **Proxy:** Time from sign-up to first "Share Bill" action < 5 minutes

### Engagement
- **Target:** Average of 3+ participants per bill (validates group utility)
- **Target:** 60% of bills have at least one confirmed payment within 24 hours

### Retention
- **Target:** 40% of Organizers return to create a second bill within 30 days
- **Proxy:** Session frequency among Organizers with ≥2 bills

### Reliability of Core Flow
- **Target:** PWD/Senior discount computation accepted as-is (no manual override) in ≥80% of cases
- **Target:** Proof-of-payment upload success rate ≥95% (file size, format compatibility)

### Satisfaction
- **Target:** Post-settlement in-app prompt NPS ≥ 40 within first 3 months
- **Qualitative:** User interviews with 5 Organizers after first use

### Growth
- **Target:** 30% of bills have at least one guest participant (validates no-login flow)
- **Proxy:** Link open rate per shared bill

---

*End of PRD v1.0*
