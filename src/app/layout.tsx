import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Link from "next/link"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Manufacturing Tracker",
  description: "Manufacturing process tracking prototype",
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 antialiased`}>
        <nav className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <span className="text-sm font-semibold text-zinc-900">
              Mfg Tracker
            </span>
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-zinc-500 hover:text-zinc-900"
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
