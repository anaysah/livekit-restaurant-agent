// components/website/hero-section-simple.tsx
"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden" //how to padding in botoom?
      style={{
        minHeight: "100svh",
        display: "flex",
        // gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        paddingLeft: "5%",
        // padding: "0 5%",
        // paddingTop: "",
        // paddingBottom: "20px",
        // gap: "60px",
      }}
    >
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--color-primary) 8%, transparent) 0%, transparent 55%),
            radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 50%)
          `,
        }}
      />

      {/* ── Left: Content ── */}
      <div className="relative z-10 w-auto">
        {/* Eyebrow */}
        <div
          className="terra-fade-up inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[4px] uppercase mb-6"
          style={{ color: "var(--color-primary)", animationDelay: "0.1s" }}
        >
          <span className="block w-7 h-px" style={{ background: "var(--color-primary)" }} />
          Modern Fusion · Est. 2019
          <span className="block w-7 h-px" style={{ background: "var(--color-primary)" }} />
        </div>

        {/* Title */}
        <h1
          className="terra-fade-up font-bold mb-6 whitespace-nowrap"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(48px, 5.5vw, 76px)",
            lineHeight: 1.08,
            letterSpacing: "-1px",
            color: "var(--color-foreground)",
            animationDelay: "0.22s",
          }}
        >
          Where Earth<br />
          Meets{" "}
          <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>Flavour</em>
        </h1>

        {/* Description */}
        <p
          className="terra-fade-up text-base leading-[1.75] font-light mb-10"
          style={{
            color: "var(--color-text-secondary)",
            maxWidth: "460px",
            animationDelay: "0.34s",
          }}
        >
          A modern fusion experience rooted in seasonal, locally-sourced ingredients.
          Every dish tells a story — earthy, bold, and beautifully unexpected.
        </p>

        {/* CTA Buttons */}
        <div
          className="terra-fade-up flex items-center gap-3.5 flex-wrap"
          style={{ animationDelay: "0.46s" }}
        >
          <Link
            href="/booking"
            className="inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold tracking-[0.3px] no-underline transition-all duration-200"
            style={{
              padding: "13px 28px",
              background: "var(--color-primary)",
              color: "var(--color-primary-fg)",
              border: "1.5px solid var(--color-primary)",
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
            🪑 Book a Table
          </Link>
          <a
            href="#menu"
            className="inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold tracking-[0.3px] no-underline transition-all duration-200"
            style={{
              padding: "13px 28px",
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
            View Menu →
          </a>
        </div>

        {/* Meta stats */}
        <div
          className="terra-fade-up flex items-center gap-7 mt-[52px] pt-8 flex-wrap"
          style={{
            borderTop: "1px solid var(--color-border)",
            animationDelay: "0.58s",
          }}
        >
          <div className="text-center">
            <div
              className="text-[28px] font-bold leading-none"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
            >
              4.9
            </div>
            <div className="text-[11px] tracking-[1px] uppercase mt-1" style={{ color: "var(--color-text-muted)" }}>
              Rating
            </div>
          </div>
          <div className="w-px h-10" style={{ background: "var(--color-border)" }} />
          <div className="text-center">
            <div
              className="text-[28px] font-bold leading-none"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
            >
              2,400+
            </div>
            <div className="text-[11px] tracking-[1px] uppercase mt-1" style={{ color: "var(--color-text-muted)" }}>
              Happy Guests
            </div>
          </div>
          <div className="w-px h-10" style={{ background: "var(--color-border)" }} />
          <div className="text-center">
            <div
              className="text-[28px] font-bold leading-none"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
            >
              60+
            </div>
            <div className="text-[11px] tracking-[1px] uppercase mt-1" style={{ color: "var(--color-text-muted)" }}>
              Menu Items
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Visual ── */}
      <div
        className="hero-visual-wrap relative flex items-center justify-center terra-fade-up"
        style={{ animationDelay: "0.3s", overflow: "hidden", alignSelf: "stretch" }}
      >
        <Image
          src="/group-5.png"
          alt="Food journey"
          width={700}
          height={800}
          priority
          style={{
            width: "100%",
            height: "auto",
            objectFit: "cover",
            objectPosition: "center bottom",
            marginTop: "-110px",
            marginBottom: "-60px",
            // filter: "drop-shadow(0 24px 48px rgba(44,28,16,0.12))",
          }}
        />
      </div>

      {/* ── Responsive: stack on mobile ── */}
      <style>{`
        @media (max-width: 900px) {
          #home {
            grid-template-columns: 1fr !important;
            text-align: center;
            padding-top: 100px !important;
          }
          #home .hero-visual-wrap { order: -1; }
        }
      `}</style>
    </section>
  )
}
