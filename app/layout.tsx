import type { Metadata } from 'next'
import { Caveat, Nunito } from 'next/font/google'
import './globals.css'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mistika 🍜 — Eat then split!',
  description: 'No more awkward bill math. Split fairly, track payments, settle up.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  )
}
