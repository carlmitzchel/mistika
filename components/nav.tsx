'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard', label: '🧾 Bills' },
  { href: '/dashboard/settings', label: '⚙️ Settings' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav className="sticky top-0 z-40 border-b-2 border-[#1C1C1C] bg-[#FFFBF5]">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🍜</span>
          <span
            className="text-xl font-bold text-[#1C1C1C]"
            style={{ fontFamily: 'var(--font-caveat)' }}
          >
            Mistika
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-bold px-3 py-1.5 rounded-full border-2 border-transparent transition-all ${
                pathname === l.href
                  ? 'bg-[#FF6B6B] text-white border-[#1C1C1C] shadow-[2px_2px_0_#1C1C1C]'
                  : 'hover:bg-white hover:border-[#1C1C1C] hover:shadow-[2px_2px_0_#1C1C1C]'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
