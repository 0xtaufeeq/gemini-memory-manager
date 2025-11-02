import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

// SF Pro inspired setup - Inter with multiple weights for typography hierarchy
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

// System monospace font for code
const systemMono = {
  variable: "--font-mono",
}

export const metadata: Metadata = {
  metadataBase: new URL('https://gemini-memory-manager.vercel.app'),
  title: {
    default: "Gemini Memory Manager - AI Assistant with Persistent Memory",
    template: "%s | Gemini Memory Manager"
  },
  description: "Revolutionary AI chat interface powered by Google Gemini with persistent memory system. The AI remembers your preferences, learns from conversations, and provides personalized responses. Experience the future of intelligent conversation.",
  keywords: [
    "AI chat",
    "Gemini AI",
    "persistent memory",
    "intelligent assistant",
    "conversation AI",
    "Google AI",
    "chat interface",
    "memory system",
    "personalized AI",
    "Next.js AI",
    "TypeScript AI",
    "Supabase",
    "machine learning",
    "artificial intelligence",
    "smart chatbot"
  ],
  authors: [{ 
    name: "Taufeeq Riyaz",
    url: "https://github.com/0xtaufeeq" 
  }],
  creator: "Taufeeq Riyaz",
  publisher: "Taufeeq Riyaz",
  applicationName: "Gemini Memory Manager",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gemini-memory-manager.vercel.app",
    siteName: "Gemini Memory Manager",
    title: "Gemini Memory Manager - AI Assistant with Persistent Memory",
    description: "Revolutionary AI chat interface powered by Google Gemini with persistent memory system. Experience personalized AI conversations that remember and learn.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gemini Memory Manager - AI Assistant with Persistent Memory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@0xtaufeeq",
    creator: "@0xtaufeeq",
    title: "Gemini Memory Manager - AI Assistant with Persistent Memory",
    description: "Revolutionary AI chat interface with persistent memory. The AI that remembers and learns from every conversation.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  category: "Technology",
  classification: "AI Assistant"
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${systemMono.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
