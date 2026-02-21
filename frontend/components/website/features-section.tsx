// components/website/features-section.tsx
"use client"

import { useEffect, useRef } from "react"

const features = [
  {
    icon: "🌱",
    title: "Zero-Mile Sourcing",
    desc: "We partner with local farms within 50 miles. Fresher ingredients, lower footprint, richer flavors.",
  },
  {
    icon: "👨‍🍳",
    title: "Open Kitchen",
    desc: "Watch our chefs work their craft at the open kitchen. No secrets — just skill, fire, and fresh produce.",
  },
  {
    icon: "🍷",
    title: "Curated Wine List",
    desc: "Our sommelier handpicks 80+ labels from small-batch producers. Natural wines, bold reds, crisp whites.",
  },
  {
    icon: "🕯️",
    title: "Intimate Atmosphere",
    desc: "Thoughtfully designed spaces — from rooftop tables to private dining rooms — for every kind of occasion.",
  },
]

export default function FeaturesSection() {
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll(".terra-card-reveal")
    if (!cards) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).style.opacity = "1"
            ;(e.target as HTMLElement).style.transform = "translateY(0)"
          }
        })
      },
      { threshold: 0.12 }
    )
    cards.forEach((card, i) => {
      ;(card as HTMLElement).style.opacity = "0"
      ;(card as HTMLElement).style.transform = "translateY(24px)"
      ;(card as HTMLElement).style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`
      observer.observe(card)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="about"
      className="px-[5%] py-[100px]"
      style={{ background: "var(--color-background-subtle)" }}
    >
      {/* Header */}
      <div className="max-w-[580px] mb-16">
        <p
          className="text-[11px] font-semibold tracking-[4px] uppercase mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          The Terra Way
        </p>
        <h2
          className="font-bold"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 4vw, 52px)",
            lineHeight: 1.15,
            letterSpacing: "-0.5px",
            color: "var(--color-foreground)",
          }}
        >
          Crafted with <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>intention</em>
        </h2>
        <p
          className="text-[15px] leading-[1.75] font-light mt-4"
          style={{ color: "var(--color-text-secondary)", maxWidth: "520px" }}
        >
          Every element of your experience — from the first bite to the last sip — is designed with care.
        </p>
      </div>

      {/* Grid */}
      <div
        ref={cardsRef}
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            className="terra-card-reveal relative overflow-hidden rounded-2xl p-8"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.transform = "translateY(-4px)"
              el.style.boxShadow = "var(--shadow-lg)"
              el.style.borderColor = "var(--color-border-light)"
              const bar = el.querySelector(".card-top-bar") as HTMLElement | null
              if (bar) bar.style.transform = "scaleX(1)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.transform = ""
              el.style.boxShadow = ""
              el.style.borderColor = "var(--color-border)"
              const bar = el.querySelector(".card-top-bar") as HTMLElement | null
              if (bar) bar.style.transform = "scaleX(0)"
            }}
          >
            {/* Top accent bar */}
            <div
              className="card-top-bar absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                transform: "scaleX(0)",
                transformOrigin: "left",
                transition: "transform 0.3s ease",
              }}
            />
            {/* Icon */}
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-2xl mb-5"
              style={{
                background: "var(--color-background-subtle)",
                border: "1px solid var(--color-border)",
              }}
            >
              {f.icon}
            </div>
            {/* Title */}
            <div
              className="text-xl font-semibold mb-2.5"
              style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
            >
              {f.title}
            </div>
            {/* Desc */}
            <p
              className="text-sm leading-[1.7] font-light"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
