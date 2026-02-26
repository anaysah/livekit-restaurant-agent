// components/website/header.tsx
"use client"

import Link from "next/link"
import { useState, useEffect } from "react" // Added useEffect
import { useTheme } from "next-themes"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false) // 1. Track mount state
  const { theme, setTheme } = useTheme()

  // 2. Set mounted to true only after the component hydrates
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navLinks = [
    { href: "/#home",    label: "Home" },
    { href: "/#menu",    label: "Menu" },
    { href: "/#about",   label: "About" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#contact", label: "Contact" },
  ]

  return (
    <nav
      className="sticky top-0 z-[100] h-[68px] flex items-center justify-between px-[5%]
                 border-b border-[var(--color-border)]"
      style={{
        background: "var(--nav-blur-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Logo */}
      <Link
        href="#home"
        className="text-[22px] font-bold tracking-[3px] no-underline"
        style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
      >
        TER<span style={{ color: "var(--color-primary)" }}>R</span>A
      </Link>

      {/* Desktop nav links */}
      <ul className="hidden md:flex items-center gap-9 list-none">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[13px] font-medium tracking-[0.5px] no-underline transition-colors duration-200"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-2.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base cursor-pointer transition-all duration-200"
          style={{
            border: "1.5px solid var(--color-border)",
            background: "transparent",
            color: "var(--color-text-secondary)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.borderColor = "var(--color-primary)"
            el.style.color = "var(--color-primary)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.borderColor = "var(--color-border)"
            el.style.color = "var(--color-text-secondary)"
          }}
        >
          {/* 3. Only render the icon if mounted. 
              This prevents the server guessing the wrong theme and causing a crash. */}
          {mounted ? (theme === "dark" ? "☀️" : "🌙") : null}
        </button>

        {/* Order Food */}
        <Link
          href="/order"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-semibold tracking-[0.3px] no-underline transition-all duration-200"
          style={{
            background: "transparent",
            border: "1.5px solid var(--color-border)",
            color: "var(--color-text-main)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.borderColor = "var(--color-primary)"
            el.style.color = "var(--color-primary)"
            el.style.background = "color-mix(in srgb, var(--color-primary) 6%, transparent)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.borderColor = "var(--color-border)"
            el.style.color = "var(--color-text-main)"
            el.style.background = "transparent"
          }}
        >
          🛵 Order Food
        </Link>

        {/* Book Table */}
        <Link
          href="/booking"
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-semibold tracking-[0.3px] no-underline transition-all duration-200"
          style={{
            background: "var(--color-primary)",
            border: "1.5px solid var(--color-primary)",
            color: "var(--color-primary-fg)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = "var(--color-primary-hover)"
            el.style.borderColor = "var(--color-primary-hover)"
            el.style.transform = "translateY(-1px)"
            el.style.boxShadow = "var(--shadow-md)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = "var(--color-primary)"
            el.style.borderColor = "var(--color-primary)"
            el.style.transform = ""
            el.style.boxShadow = ""
          }}
        >
          🪑 Book Table
        </Link>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden text-[var(--color-foreground)] p-1"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="absolute top-[68px] left-0 right-0 md:hidden py-4 flex flex-col gap-3 px-6 border-b"
          style={{ background: "var(--color-background)", borderColor: "var(--color-border)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium no-underline"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/booking"
            onClick={() => setMobileOpen(false)}
            className="px-5 py-2.5 rounded-lg text-center text-[13px] font-semibold"
            style={{ background: "var(--color-primary)", color: "var(--color-primary-fg)" }}
          >
            🪑 Book Table
          </Link>
          <Link
            href="/order"
            onClick={() => setMobileOpen(false)}
            className="px-5 py-2.5 rounded-lg text-center text-[13px] font-semibold"
            style={{ border: "1.5px solid var(--color-border)", color: "var(--color-text-main)" }}
          >
            🛵 Order Food
          </Link>
        </div>
      )}
    </nav>
  )
}