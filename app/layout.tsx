import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StudyBae - Educational AI Tools',
  description: 'AI-powered learning tools: Flashcard Maker, Quiz Generator, and Study Buddy',
  // Applying the theme color to match the dark application background (Near Black)
  // themeColor moved to the `viewport` export to satisfy Next.js metadata rules
}

// Move themeColor to viewport export (Next.js expects themeColor here)
export const viewport = {
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* The main background is set to the dark hacker theme via ./globals.css */}
      <body className={inter.className}>{children}</body>
    </html>
  )
}