import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Restaurant</h3>
              <p className="text-text-muted text-sm">
                Creating memorable dining experiences since 2015. Your satisfaction is our passion.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/#home" className="text-text-muted hover:text-primary text-sm transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#about" className="text-text-muted hover:text-primary text-sm transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="text-text-muted hover:text-primary text-sm transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/booking" className="text-text-muted hover:text-primary text-sm transition-colors">
                    Book a Table
                  </Link>
                </li>
                <li>
                  <Link href="/order" className="text-text-muted hover:text-primary text-sm transition-colors">
                    Order Online
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Contact</h3>
              <ul className="space-y-2 text-text-muted text-sm">
                <li>📍 123 Main Street, City</li>
                <li>📞 +1 (234) 567-890</li>
                <li>✉️ info@restaurant.com</li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Opening Hours</h3>
              <ul className="space-y-2 text-text-muted text-sm">
                <li>Mon - Fri: 11:00 AM - 11:00 PM</li>
                <li>Saturday: 10:00 AM - 12:00 AM</li>
                <li>Sunday: 10:00 AM - 10:00 PM</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-text-muted text-sm">
              © 2026 Restaurant. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
