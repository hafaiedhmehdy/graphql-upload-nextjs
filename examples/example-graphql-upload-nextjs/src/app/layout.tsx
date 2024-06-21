import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  description: 'Seamlessly enable GraphQL multipart requests for file uploads with Apollo Server in your Next.js integration.',
  title: 'Example GraphQL Upload Next.js'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-US">
      <body className={inter.className}>{children}</body>
    </html>
  )
}