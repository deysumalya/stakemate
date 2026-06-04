'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/commit", label: "Commit" },
  { href: "/profile", label: "Profile" },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Logo with glow */}
        <Link
          href="/dashboard"
          className="font-black text-xl tracking-tighter text-primary animate-sm-logo-glow select-none"
        >
          STAKEMATE
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link-underline text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "active text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {/* Sign Out */}
          <form action="/auth/signout" method="post">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              Sign Out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  )
}
