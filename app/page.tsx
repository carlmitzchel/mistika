import Link from 'next/link'

const steps = [
  { emoji: '📸', title: 'Scan or type', desc: 'Point your camera at the receipt or add items manually' },
  { emoji: '👥', title: 'Assign to friends', desc: 'Split equally or assign each item to the right person' },
  { emoji: '💸', title: 'Collect & settle', desc: 'Everyone sees what they owe and can pay with GCash or Maya' },
]

const doodles = ['⭐', '✨', '🌀', '💫', '🎈', '🌸', '🍋', '🎀']

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FFFBF5] overflow-x-hidden">
      <nav className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between border-b-2 border-[#1C1C1C]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍜</span>
          <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-caveat)' }}>Mistika</span>
        </div>
        <Link href="/dashboard/bills/new" className="btn-doodle btn-coral text-sm">
          Start splitting →
        </Link>
      </nav>

      <section className="max-w-lg mx-auto px-4 pt-12 pb-8 text-center">
        <div className="relative mb-2 select-none pointer-events-none h-8">
          <span className="absolute left-4 top-0 text-2xl opacity-60 float" style={{ animationDelay: '0s' }}>⭐</span>
          <span className="absolute right-8 top-2 text-xl opacity-50 float" style={{ animationDelay: '0.6s' }}>✨</span>
          <span className="absolute left-12 bottom-0 text-xl opacity-40 float" style={{ animationDelay: '1.2s' }}>🌸</span>
          <span className="absolute right-12 bottom-0 text-2xl opacity-50 float" style={{ animationDelay: '0.9s' }}>💫</span>
        </div>

        <div className="wobble text-7xl mb-4 inline-block">🍜</div>

        <h1 className="text-5xl font-bold text-[#1C1C1C] leading-tight mb-3" style={{ fontFamily: 'var(--font-caveat)' }}>
          Eat then split!
        </h1>
        <p className="text-base font-semibold text-[#555] max-w-xs mx-auto leading-relaxed mb-8">
          No more awkward math at the table. Split bills fairly, track who owes what, and settle up in seconds. 🎉
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link href="/dashboard/bills/new" className="btn-doodle btn-coral text-base w-full max-w-xs justify-center">
            🧾 Create a new bill
          </Link>
          <Link href="/dashboard" className="btn-doodle btn-ghost text-base w-full max-w-xs justify-center">
            📋 View my bills
          </Link>
        </div>
        <p className="mt-5 text-sm text-[#888] font-semibold">No account needed for participants 👆</p>
      </section>

      <section className="max-w-lg mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-center mb-6" style={{ fontFamily: 'var(--font-caveat)' }}>
          How it works ✍️
        </h2>
        <div className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="doodle-card p-5 flex items-start gap-4 slide-up"
              style={{ animationDelay: `${i * 0.1}s`, transform: i % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)' }}
            >
              <span className="text-4xl shrink-0">{step.emoji}</span>
              <div>
                <p className="font-bold text-lg text-[#1C1C1C]">{step.title}</p>
                <p className="text-sm text-[#666] font-semibold mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-lg mx-auto px-4 py-4">
        <div className="doodle-card p-5 text-center" style={{ background: '#FFD93D', transform: 'rotate(-0.3deg)' }}>
          <p className="text-2xl mb-2">🇵🇭</p>
          <p className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-caveat)' }}>Built for Pinoy group meals</p>
          <p className="text-sm font-semibold text-[#444]">
            Auto-computes PWD & Senior Citizen discounts ✅<br />
            Works with GCash & Maya 💚<br />
            No sign-up needed for your barkada 🙌
          </p>
        </div>
      </section>

      <footer className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="flex justify-center gap-3 flex-wrap text-xl mb-3 select-none">
          {doodles.map((d) => <span key={d}>{d}</span>)}
        </div>
        <p className="text-sm text-[#999] font-semibold">Mistika — made with 🍜 and ❤️</p>
      </footer>
    </main>
  )
}
