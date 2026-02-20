// components/website/header-simple.tsx
"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#about", label: "About Us" },
    { href: "/#services", label: "Services" },
    { href: "/#team", label: "Team" },
    { href: "/#faqs", label: "FAQS" },
  ]

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mx-auto py-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-foreground">Restaurant</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.label === "Home"
                    ? "text-primary"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            {/* CTA Buttons */}
            <div className="hidden md:block">
              <Link
                href="/booking"
                className="bg-primary text-white rounded-sm hover:bg-secondary transition-colors px-4 py-2"
              >
                Book A Table
              </Link>
            </div>

            <div className="hidden md:block">
              <Link
                href="/order"
                className="bg-primary text-white rounded-sm hover:bg-secondary transition-colors px-4 py-2"
              >
                Order
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    link.label === "Home" ? "text-primary" : "text-text-secondary"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/booking"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-2.5 bg-primary text-white rounded-sm font-medium text-center"
              >
                Book A Table
              </Link>
              <Link
                href="/order"
                onClick={() => setMobileMenuOpen(false)}
                className="px-6 py-2.5 border border-primary text-primary rounded-sm font-medium text-center hover:bg-primary hover:text-white transition-colors"
              >
                Order Online
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
