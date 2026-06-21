import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Nasdaq Risk Radar',
  description: 'Radar de riesgo especializado en Nasdaq — Fed, Trump, geopolítica, tech y volatilidad filtrados por IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black text-on-background overflow-hidden h-screen">{children}</body>
    </html>
  )
}
