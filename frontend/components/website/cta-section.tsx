// components/website/cta-section.tsx
"use client"

import Link from "next/link"

export default function CTASection() {
  return (
    <section
      id="reserve"
      className="relative overflow-hidden px-[5%] py-[80px]"
      style={{ background: "var(--color-foreground)" }}
    >
      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 15% 50%, color-mix(in srgb, var(--color-primary) 20%, transparent) 0%, transparent 55%),
            radial-gradient(circle at 85% 30%, color-mix(in srgb, var(--color-accent) 15%, transparent) 0%, transparent 50%)
          `,
        }}
      />

      <div
        className="relative z-10 flex items-center justify-between gap-12 flex-wrap"
      >
        {/* Text */}
        <div>
          <p
            className="text-[11px] font-semibold tracking-[4px] uppercase mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Reserve Your Evening
          </p>
          <h2
            className="font-bold"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(32px, 4vw, 52px)",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              color: "var(--color-background)",
              maxWidth: "520px",
            }}
          >
            A table is waiting —{" "}
            <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>make it yours</em>
          </h2>
          <p
            className="text-[15px] leading-[1.75] font-light mt-3.5"
            style={{
              color: "color-mix(in srgb, var(--color-background) 65%, transparent)",
              maxWidth: "440px",
            }}
          >
            Walk-ins welcome, but reservations guarantee your spot. Book online in under a minute.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3.5 flex-wrap flex-shrink-0">
          <Link
            href="/booking"
            className="inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold tracking-[0.3px] no-underline transition-all duration-200"
            style={{
              padding: "14px 32px",
              background: "var(--color-background)",
              border: "1.5px solid var(--color-background)",
              color: "var(--color-foreground)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.background = "var(--color-card)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.background = "var(--color-background)"
            }}
          >
            🪑 Book a Table
          </Link>
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold tracking-[0.3px] no-underline transition-all duration-200"
            style={{
              padding: "14px 28px",
              background: "transparent",
              border: "1.5px solid color-mix(in srgb, var(--color-background) 35%, transparent)",
              color: "var(--color-background)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-background)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                "color-mix(in srgb, var(--color-background) 35%, transparent)"
            }}
          >
            🛵 Order Delivery
          </Link>
        </div>
      </div>
    </section>
  )
}
