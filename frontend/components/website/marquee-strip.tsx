// components/website/marquee-strip.tsx

const items = [
  "Farm to Table", "Open Kitchen", "Seasonal Menu", "Private Dining",
  "Craft Cocktails", "Live Music Fridays", "Vegan Options", "Chef's Tasting Menu",
]

export default function MarqueeStrip() {
  // Double the items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      className="overflow-hidden py-3.5"
      style={{ background: "var(--color-primary)" }}
    >
      <div className="terra-marquee flex gap-0 whitespace-nowrap" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center">
            <span
              className="text-xs font-semibold tracking-[3px] uppercase px-7"
              style={{ color: "var(--color-primary-fg)", opacity: 0.9 }}
            >
              {item}
            </span>
            <span
              className="text-xs px-0"
              style={{ color: "color-mix(in srgb, var(--color-primary-fg) 40%, transparent)" }}
            >
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
