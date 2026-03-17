"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import QRCode from "react-qr-code";

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = "PHP" | "USD" | "SGD" | "HKD";
type SplitMethod = "equal" | "byitem";
type DiscountType = "senior" | "pwd" | null;
type PaymentType = "gcash" | "maya" | "bank" | "cash";

interface Participant {
  id: string;
  name: string;
  discountType: DiscountType;
}

interface Item {
  id: string;
  name: string;
  price: number; // centavos
  assignedTo: string[]; // participant ids
}

interface PaymentMethod {
  id: string;
  type: PaymentType;
  label: string;
  accountDetails: string;
}

interface BillData {
  title: string;
  restaurantName: string;
  currency: Currency;
  splitMethod: SplitMethod;
  vatRegistered: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (c: number) =>
  "₱" + (c / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

let idCounter = 0;
const uid = () => `id-${++idCounter}`;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`step-dot transition-all ${
            i === current ? "active" : i < current ? "done" : ""
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step 0: Bill details ─────────────────────────────────────────────────────

function StepBillDetails({
  data,
  onChange,
  onNext,
}: {
  data: BillData;
  onChange: (d: Partial<BillData>) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        📋 Bill details
      </h2>

      <div>
        <label className="block text-sm font-bold mb-1">Bill title *</label>
        <input
          className="input-doodle"
          placeholder="e.g. Dinner at Manam 🍖"
          value={data.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({ title: e.target.value })
          }
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">
          Restaurant name (optional)
        </label>
        <input
          className="input-doodle"
          placeholder="e.g. Manam"
          value={data.restaurantName}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onChange({ restaurantName: e.target.value })
          }
        />
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">Currency</label>
        <select
          className="input-doodle"
          value={data.currency}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onChange({ currency: e.target.value as Currency })
          }
        >
          <option value="PHP">🇵🇭 PHP</option>
          <option value="USD">🇺🇸 USD</option>
          <option value="SGD">🇸🇬 SGD</option>
          <option value="HKD">🇭🇰 HKD</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold mb-2">VAT</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ vatRegistered: true })}
            className={`btn-doodle flex-1 text-sm ${data.vatRegistered ? "btn-coral" : "btn-ghost"}`}
          >
            VAT Registered ✅
          </button>
          <button
            type="button"
            onClick={() => onChange({ vatRegistered: false })}
            className={`btn-doodle flex-1 text-sm ${!data.vatRegistered ? "btn-coral" : "btn-ghost"}`}
          >
            Non-VAT 🚫
          </button>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!data.title.trim()}
        className="btn-doodle btn-coral w-full mt-2"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Step 1: Add people ───────────────────────────────────────────────────────

function StepAddPeople({
  participants,
  onAdd,
  onRemove,
  onToggleDiscount,
  onNext,
}: {
  participants: Participant[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onToggleDiscount: (id: string, type: "senior" | "pwd") => void;
  onNext: () => void;
}) {
  const [nameInput, setNameInput] = useState("");

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onAdd(nameInput.trim());
      setNameInput("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        👥 Add people
      </h2>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="input-doodle flex-1"
          placeholder="Name"
          value={nameInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNameInput(e.target.value)
          }
        />
        <button type="submit" className="btn-doodle btn-mint whitespace-nowrap">
          Add 👤
        </button>
      </form>

      {participants.length === 0 && (
        <p className="text-sm text-[#9CA3AF] text-center py-3">
          No participants yet. Add someone above!
        </p>
      )}

      <div className="flex flex-col gap-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="doodle-card-sm p-3 flex items-center gap-2 flex-wrap"
          >
            <span className="font-bold flex-1">{p.name}</span>
            <button
              type="button"
              onClick={() => onToggleDiscount(p.id, "senior")}
              className={`btn-doodle text-xs ${p.discountType === "senior" ? "btn-coral" : "btn-ghost"}`}
              style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem" }}
            >
              👴 Senior
            </button>
            <button
              type="button"
              onClick={() => onToggleDiscount(p.id, "pwd")}
              className={`btn-doodle text-xs ${p.discountType === "pwd" ? "btn-coral" : "btn-ghost"}`}
              style={{ fontSize: "0.7rem", padding: "0.25rem 0.6rem" }}
            >
              ♿ PWD
            </button>
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="btn-doodle btn-ghost text-xs font-bold"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
              aria-label={`Remove ${p.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={participants.length === 0}
        className="btn-doodle btn-coral w-full mt-2"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Step 2: Add items ────────────────────────────────────────────────────────

function StepAddItems({
  items,
  participants,
  onAdd,
  onRemove,
  onToggleAssign,
  onNext,
}: {
  items: Item[];
  participants: Participant[];
  onAdd: (name: string, price: number) => void;
  onRemove: (id: string) => void;
  onToggleAssign: (itemId: string, participantId: string) => void;
  onNext: () => void;
}) {
  const [nameInput, setNameInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput);
    if (nameInput.trim() && !isNaN(priceNum) && priceNum > 0) {
      onAdd(nameInput.trim(), Math.round(priceNum * 100));
      setNameInput("");
      setPriceInput("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          🛒 Add items
        </h2>
        <div className="relative">
          <button
            type="button"
            className="btn-doodle btn-yellow text-xs"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.7rem" }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip((v) => !v)}
          >
            📸 Scan receipt
          </button>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-1 bg-[#1C1C1C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap z-10">
              Coming soon 🔜
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
        <input
          className="input-doodle flex-1 min-w-0"
          placeholder="Item name"
          value={nameInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNameInput(e.target.value)
          }
          style={{ minWidth: "120px" }}
        />
        <input
          className="input-doodle w-28"
          placeholder="₱ Price"
          type="number"
          min="0"
          step="0.01"
          value={priceInput}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPriceInput(e.target.value)
          }
        />
        <button type="submit" className="btn-doodle btn-mint whitespace-nowrap">
          Add 🛒
        </button>
      </form>

      {items.length === 0 && (
        <p className="text-sm text-[#9CA3AF] text-center py-3">
          No items yet. Add items above!
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="doodle-card-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#FF6B6B]">
                  {fmt(item.price)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="btn-doodle btn-ghost text-xs"
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {participants.length === 0 ? (
                <span className="badge badge-open text-xs">Everyone</span>
              ) : item.assignedTo.length === 0 ? (
                <span className="badge badge-open text-xs">Everyone</span>
              ) : null}
              {participants.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggleAssign(item.id, p.id)}
                  className={`badge cursor-pointer border-2 border-[#1C1C1C] text-xs ${
                    item.assignedTo.includes(p.id)
                      ? "badge-settled"
                      : "badge-open"
                  }`}
                  style={{ fontSize: "0.7rem" }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={items.length === 0}
        className="btn-doodle btn-coral w-full mt-2"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Step 3: Payment info ─────────────────────────────────────────────────────

function StepPaymentInfo({
  methods,
  onAdd,
  onNext,
}: {
  methods: PaymentMethod[];
  onAdd: (m: PaymentMethod) => void;
  onNext: () => void;
}) {
  const [type, setType] = useState<PaymentType>("gcash");
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      id: uid(),
      type,
      label: label.trim(),
      accountDetails: details.trim(),
    });
    setLabel("");
    setDetails("");
  };

  const typeConfig: { value: PaymentType; label: string; emoji: string }[] = [
    { value: "gcash", label: "GCash", emoji: "💚" },
    { value: "maya", label: "Maya", emoji: "💜" },
    { value: "bank", label: "Bank", emoji: "🏦" },
    { value: "cash", label: "Cash", emoji: "💵" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        💳 Payment info
      </h2>

      <div>
        <label className="block text-sm font-bold mb-2">Payment type</label>
        <div className="flex gap-2 flex-wrap">
          {typeConfig.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`btn-doodle text-sm ${type === t.value ? "btn-coral" : "btn-ghost"}`}
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.9rem" }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold mb-1">Label</label>
        <input
          className="input-doodle"
          placeholder={`e.g. My ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          value={label}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setLabel(e.target.value)
          }
        />
      </div>

      {type !== "cash" && (
        <div>
          <label className="block text-sm font-bold mb-1">
            Account details
          </label>
          <input
            className="input-doodle"
            placeholder={type === "bank" ? "Account number" : "0917-123-4567"}
            value={details}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setDetails(e.target.value)
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!label.trim()}
        className="btn-doodle btn-mint w-full"
      >
        Add method +
      </button>

      {methods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <span key={m.id} className="badge badge-proof text-xs px-3 py-1">
              {m.type === "gcash"
                ? "💚"
                : m.type === "maya"
                  ? "💜"
                  : m.type === "bank"
                    ? "🏦"
                    : "💵"}{" "}
              {m.label}
            </span>
          ))}
        </div>
      )}

      <button onClick={onNext} className="btn-doodle btn-coral w-full mt-2">
        Next →
      </button>
    </div>
  );
}

// ─── Step 4: Review & share ───────────────────────────────────────────────────

function StepReview({
  billData,
  participants,
  items,
  saving,
  billSlug,
  onSave,
}: {
  billData: BillData;
  participants: Participant[];
  items: Item[];
  saving: boolean;
  billSlug: string | null;
  onSave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const totalCentavos = items.reduce((sum, item) => sum + item.price, 0);
  const perPersonCentavos =
    participants.length > 0
      ? Math.round(totalCentavos / participants.length)
      : 0;

  const shareUrl = billSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/bills/${billSlug}`
    : null;

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        🎉 Review & share
      </h2>

      {/* Summary card */}
      <div className="doodle-card p-4 rotate-[-0.4deg]">
        <h3
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          {billData.title || "Untitled bill"}
        </h3>
        <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#6B7280] mb-3">
          <span>👥 {participants.length} people</span>
          <span>🛒 {items.length} items</span>
          <span>{billData.currency}</span>
        </div>
        <div
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-caveat)" }}
        >
          Total: {fmt(totalCentavos)}
        </div>
      </div>

      {/* Per-person breakdown */}
      {participants.length > 0 && (
        <div className="doodle-card p-4 rotate-[0.3deg]">
          <h3
            className="text-lg font-bold mb-3"
            style={{ fontFamily: "var(--font-caveat)" }}
          >
            💰 Shares (equal split)
          </h3>
          <div className="flex flex-col gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm font-semibold"
              >
                <span>
                  {p.name}
                  {p.discountType ? ` (${p.discountType})` : ""}
                </span>
                <span className="text-[#FF6B6B]">{fmt(perPersonCentavos)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save or share */}
      {!billSlug ? (
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-doodle btn-coral w-full mt-2"
        >
          {saving ? "Creating..." : "Create Bill ✨"}
        </button>
      ) : (
        <div className="doodle-card p-4 rotate-[-0.3deg]">
          <h3
            className="text-lg font-bold mb-3"
            style={{ fontFamily: "var(--font-caveat)" }}
          >
            🔗 Share with participants
          </h3>
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl border-2 border-[#1C1C1C] inline-block shadow-sm">
              <QRCode value={shareUrl ?? ""} size={160} />
            </div>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              className="input-doodle flex-1 text-sm bg-white"
              value={shareUrl ?? ""}
              readOnly
              style={{ fontSize: "0.8rem" }}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="btn-doodle btn-coral whitespace-nowrap"
              style={{ fontSize: "0.85rem", padding: "0.5rem 0.9rem" }}
            >
              {copied ? "✅ Done!" : "📋 Copy"}
            </button>
          </div>
          {copied && (
            <p className="text-sm font-bold text-[#6BCB77]">
              ✅ Link copied to clipboard!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main wizard component ────────────────────────────────────────────────────

export default function NewBillPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [billSlug, setBillSlug] = useState<string | null>(null);
  const [billData, setBillData] = useState<BillData>({
    title: "",
    restaurantName: "",
    currency: "PHP",
    splitMethod: "equal",
    vatRegistered: true,
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const totalSteps = 5;

  const addParticipant = (name: string) => {
    setParticipants((prev) => [
      ...prev,
      { id: uid(), name, discountType: null },
    ]);
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleDiscount = (id: string, type: "senior" | "pwd") => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, discountType: p.discountType === type ? null : type }
          : p,
      ),
    );
  };

  const addItem = (name: string, price: number) => {
    setItems((prev) => [...prev, { id: uid(), name, price, assignedTo: [] }]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleAssign = (itemId: string, participantId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const assignedTo = item.assignedTo.includes(participantId)
          ? item.assignedTo.filter((id) => id !== participantId)
          : [...item.assignedTo, participantId];
        return { ...item, assignedTo };
      }),
    );
  };

  const addPaymentMethod = (m: PaymentMethod) => {
    setPaymentMethods((prev) => [...prev, m]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Create the bill
      const billRes = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: billData.title,
          restaurantName: billData.restaurantName || undefined,
          currency: billData.currency,
          defaultSplitMethod:
            billData.splitMethod === "byitem" ? "item" : "equal",
          vatRegistered: billData.vatRegistered,
        }),
      });
      if (!billRes.ok) throw new Error("Failed to create bill");
      const bill = await billRes.json();
      const slug = bill.slug;

      // 2. Add participants in parallel
      const participantMap: Record<string, string> = {}; // local id → server id
      await Promise.all(
        participants.map(async (p) => {
          const res = await fetch(`/api/bills/${slug}/participants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: p.name,
              discountType: p.discountType,
            }),
          });
          if (res.ok) {
            const created = await res.json();
            participantMap[p.id] = created.id;
          }
        }),
      );

      // 3. Add items in parallel (remap assignedTo to server participant IDs)
      await Promise.all(
        items.map(async (item) => {
          const assignedTo = item.assignedTo
            .map((localId) => participantMap[localId])
            .filter(Boolean);
          await fetch(`/api/bills/${slug}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              price: item.price,
              assignedTo,
            }),
          });
        }),
      );

      // 4. Add payment methods in parallel
      await Promise.all(
        paymentMethods.map(async (m) => {
          const formData = new FormData();
          formData.append("type", m.type);
          formData.append("label", m.label);
          formData.append("accountDetails", m.accountDetails);
          await fetch(`/api/bills/${slug}/payment-methods`, {
            method: "POST",
            body: formData,
          });
        }),
      );

      setBillSlug(slug);
    } catch (e) {
      console.error("Failed to create bill:", e);
      alert("Something went wrong creating the bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1
        className="text-3xl font-bold mb-4"
        style={{ fontFamily: "var(--font-caveat)" }}
      >
        New Bill ✨
      </h1>

      <StepDots current={step} total={totalSteps} />

      <div className="doodle-card p-5">
        {step === 0 && (
          <StepBillDetails
            data={billData}
            onChange={(d) => setBillData((prev) => ({ ...prev, ...d }))}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepAddPeople
            participants={participants}
            onAdd={addParticipant}
            onRemove={removeParticipant}
            onToggleDiscount={toggleDiscount}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepAddItems
            items={items}
            participants={participants}
            onAdd={addItem}
            onRemove={removeItem}
            onToggleAssign={toggleAssign}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepPaymentInfo
            methods={paymentMethods}
            onAdd={addPaymentMethod}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <StepReview
            billData={billData}
            participants={participants}
            items={items}
            saving={saving}
            billSlug={billSlug}
            onSave={handleSave}
          />
        )}
      </div>

      {step > 0 && !billSlug && (
        <button
          onClick={() => setStep((s) => s - 1)}
          className="btn-doodle btn-ghost w-full mt-3 text-sm"
        >
          ← Back
        </button>
      )}

      {billSlug && (
        <button
          onClick={() => router.push(`/dashboard/bills/${billSlug}`)}
          className="btn-doodle btn-mint w-full mt-3 text-sm"
        >
          Go to bill →
        </button>
      )}
    </div>
  );
}
