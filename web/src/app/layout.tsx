import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Digital Vault 2.0',
    template: '%s | Digital Vault 2.0',
  },
  description:
    'Secure document management for individuals and teams. Store, organize, and share your documents with confidence.',
  keywords: ['document management', 'secure storage', 'file organizer', 'digital vault'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
