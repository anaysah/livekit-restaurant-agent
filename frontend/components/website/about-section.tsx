// components/website/about-section.tsx
"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

const highlights = [
  "Every menu changes with the season — sometimes weekly — to honour what's truly fresh.",
  "We work with 12 local farms and producers, most within a 50km radius of our kitchen.",
  "Our team believes dining is a ritual. We design the full experience — light, sound, and plate.",
]

export default function AboutSection() {
  const imgRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
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
    imgRefs.current.forEach((el, i) => {
      if (!el) return
      el.style.opacity = "0"
      el.style.transform = "translateY(24px)"
      el.style.transition = `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`
      observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="px-[5%] py-[100px]"
      style={{ background: "var(--color-background-subtle)" }}
    >
      <div
        className="grid gap-20 items-center"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Visual grid */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            height: "460px",
          }}
        >
          {/* Big left image */}
          <div
            ref={(el) => { imgRefs.current[0] = el }}
            className="rounded-2xl flex items-center justify-center text-[72px] overflow-hidden relative cursor-default"
            style={{
              gridRow: "1 / 3",
              background: "color-mix(in srgb, var(--color-primary) 12%, var(--color-card))",
              border: "1px solid var(--color-border)",
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "" }}
          >
            🍳
          </div>

          {/* Top right */}
          <div
            ref={(el) => { imgRefs.current[1] = el }}
            className="rounded-xl flex items-center justify-center text-[48px] overflow-hidden relative cursor-default"
            style={{
              background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-card))",
              border: "1px solid var(--color-border)",
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "" }}
          >
            🌾
          </div>

          {/* Bottom right */}
          <div
            ref={(el) => { imgRefs.current[2] = el }}
            className="rounded-xl flex items-center justify-center text-[48px] overflow-hidden relative cursor-default"
            style={{
              background: "color-mix(in srgb, var(--color-warning) 12%, var(--color-card))",
              border: "1px solid var(--color-border)",
              transition: "transform 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "" }}
          >
            🍷
          </div>
        </div>

        {/* Content */}
        <div>
          <p
            className="text-[11px] font-semibold tracking-[4px] uppercase mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Our Story
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
            Food that <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>remembers</em> the earth
          </h2>
          <p
            className="text-[15px] leading-[1.75] font-light mt-4"
            style={{ color: "var(--color-text-secondary)", maxWidth: "520px" }}
          >
            Terra was born in 2019 from a simple belief — that the best food comes from honest ingredients,
            cooked with respect. Our founder, Chef Aarav Mehta, trained across five countries before
            returning home to create something rooted.
          </p>

          <ul className="mt-8 flex flex-col gap-4 list-none">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3.5 text-sm leading-[1.65] font-light"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <span
                  className="mt-1 flex-shrink-0 text-[10px]"
                  style={{ color: "var(--color-primary)" }}
                >
                  ✦
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link
              href="#"
              className="inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold tracking-[0.3px] no-underline transition-all duration-200"
              style={{
                padding: "13px 28px",
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
              Meet the Team →
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .about-grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
