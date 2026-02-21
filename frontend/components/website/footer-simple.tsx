// components/website/footer-simple.tsx
"use client"

import Link from "next/link"

const exploreLinks = ["Menu", "Chef's Table", "Private Dining", "Events", "Gift Cards"]
const visitLinks = [
  "📍 12, Lodhi Colony, New Delhi",
  "📞 +91 98765 43210",
  "✉️ hello@terra.in",
  "Mon–Sun: 12pm–11pm",
]
const companyLinks = ["About Us", "Careers", "Press", "Sustainability", "Privacy Policy"]
const socials = ["📸", "🐦", "💼", "▶️"]

const linkStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--color-text-muted)",
  textDecoration: "none",
  fontWeight: 300,
  transition: "color 0.2s",
}

export default function Footer() {
  return (
    <footer
      id="contact"
      style={{
        background: "var(--color-background-light)",
        borderTop: "1px solid var(--color-border)",
        padding: "64px 5% 32px",
      }}
    >
      {/* Grid */}
      <div
        className="grid gap-12 mb-12"
        style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
      >
        {/* Brand */}
        <div>
          <div
            className="text-xl font-bold tracking-[3px] mb-3.5"
            style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
          >
            TER<span style={{ color: "var(--color-primary)" }}>R</span>A
          </div>
          <p
            className="text-[13px] leading-[1.7] font-light"
            style={{ color: "var(--color-text-muted)", maxWidth: "240px" }}
          >
            Modern fusion dining rooted in seasonal, locally-sourced ingredients. Open daily, noon to midnight.
          </p>
          <div className="flex gap-2.5 mt-6">
            {socials.map((icon) => (
              <a
                key={icon}
                href="#"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[15px] no-underline transition-all duration-200"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = "var(--color-primary)"
                  el.style.background = "color-mix(in srgb, var(--color-primary) 8%, transparent)"
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderColor = "var(--color-border)"
                  el.style.background = "transparent"
                }}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4
            className="text-xs font-semibold tracking-[2px] uppercase mb-[18px]"
            style={{ color: "var(--color-foreground)" }}
          >
            Explore
          </h4>
          <ul className="flex flex-col gap-2.5 list-none">
            {exploreLinks.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-primary)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-muted)" }}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Visit Us */}
        <div>
          <h4
            className="text-xs font-semibold tracking-[2px] uppercase mb-[18px]"
            style={{ color: "var(--color-foreground)" }}
          >
            Visit Us
          </h4>
          <ul className="flex flex-col gap-2.5 list-none">
            {visitLinks.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-primary)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-muted)" }}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4
            className="text-xs font-semibold tracking-[2px] uppercase mb-[18px]"
            style={{ color: "var(--color-foreground)" }}
          >
            Company
          </h4>
          <ul className="flex flex-col gap-2.5 list-none">
            {companyLinks.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  style={linkStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-primary)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-muted)" }}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex justify-between items-center flex-wrap gap-3 pt-6"
        style={{ borderTop: "1px solid var(--color-border-light)" }}
      >
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          © 2025 <span style={{ color: "var(--color-primary)" }}>Terra</span> Restaurant. All rights reserved.
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Made with <span style={{ color: "var(--color-primary)" }}>♥</span> in New Delhi
        </p>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          footer > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          footer > div:first-child { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  )
}
