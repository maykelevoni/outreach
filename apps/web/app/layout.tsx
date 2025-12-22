import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCProvider } from '@/lib/trpc/Provider'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Outreach - Email Automation System',
  description: 'Automated email outreach system for Google Maps businesses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
        </TRPCProvider>
      </body>
    </html>
  )
}
