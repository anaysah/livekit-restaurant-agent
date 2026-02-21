// components/website/testimonials-section.tsx
"use client"

import { useEffect, useRef } from "react"

const testimonials = [
  {
    stars: "★★★★★",
    text: "The harvest bowl changed how I think about vegetarian food. Rich, layered, deeply satisfying. I've been back four times.",
    avatar: "👩",
    name: "Priya Nair",
    location: "Mumbai · Regular Guest",
  },
  {
    stars: "★★★★★",
    text: "Booked the private dining room for our anniversary. Every detail was perfect — the lighting, the custom menu, the wine pairing.",
    avatar: "👨",
    name: "Karan & Sneha",
    location: "Delhi · Anniversary Dinner",
  },
  {
    stars: "★★★★★",
    text: "The open kitchen concept is brilliant. Watching the chefs work while you eat adds a whole new dimension. Miso broth is a must.",
    avatar: "🧑",
    name: "Rohan Desai",
    location: "Bangalore · Food Blogger",
  },
]

export default function TestimonialsSection() {
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cards = cardsRef.current?.querySelectorAll(".testi-reveal")
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
      ;(card as HTMLElement).style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`
      observer.observe(card)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <section id="reviews" className="px-[5%] py-[100px]">
      {/* Header */}
      <div className="text-center mb-[60px]">
        <p
          className="text-[11px] font-semibold tracking-[4px] uppercase mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Guest Love
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
          What people are <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>saying</em>
        </h2>
        <p
          className="text-[15px] leading-[1.75] font-light mt-4 mx-auto"
          style={{ color: "var(--color-text-secondary)", maxWidth: "520px" }}
        >
          Honest words from people who've shared a meal with us.
        </p>
      </div>

      {/* Cards */}
      <div
        ref={cardsRef}
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="testi-reveal rounded-2xl p-7 transition-all duration-200"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = "var(--shadow-lg)"
              el.style.transform = "translateY(-2px)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.boxShadow = ""
              el.style.transform = ""
            }}
          >
            {/* Stars */}
            <div
              className="text-sm mb-3.5 tracking-[2px]"
              style={{ color: "var(--color-primary)" }}
            >
              {t.stars}
            </div>

            {/* Text */}
            <p
              className="text-[15px] leading-[1.75] font-light italic mb-5"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span style={{ color: "var(--color-primary)", fontSize: "20px", fontStyle: "normal" }}>"</span>
              {t.text}
              <span style={{ color: "var(--color-primary)", fontSize: "20px", fontStyle: "normal" }}>"</span>
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  background: "var(--color-background-subtle)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {t.avatar}
              </div>
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {t.name}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t.location}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
