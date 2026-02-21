// components/website/menu-section.tsx
"use client"

import { useState, useEffect, useRef } from "react"

type MenuItem = {
  emoji: string
  badge: { label: string; type: "new" | "chef" | "pop" }
  name: string
  price: string
  desc: string
  tags: string[]
}

const menuData: Record<string, MenuItem[]> = {
  Starters: [
    {
      emoji: "🥗",
      badge: { label: "Chef's Pick", type: "chef" },
      name: "Terra Harvest Bowl",
      price: "₹680",
      desc: "Roasted seasonal vegetables, whipped goat cheese, pomegranate, candied walnuts & herb oil.",
      tags: ["🌿 Vegan", "Gluten Free"],
    },
    {
      emoji: "🍜",
      badge: { label: "New", type: "new" },
      name: "Miso Bone Broth",
      price: "₹520",
      desc: "Slow-simmered 24hr bone broth, white miso, crispy shallots, hand-pulled noodles, soft egg.",
      tags: ["🌶 Spicy", "Signature"],
    },
    {
      emoji: "🫙",
      badge: { label: "Popular", type: "pop" },
      name: "Burrata & Heirloom",
      price: "₹740",
      desc: "Fresh burrata, heirloom tomatoes, basil oil, dehydrated olives, sourdough croutons.",
      tags: ["Vegetarian", "🇮🇹 Italian"],
    },
  ],
  Mains: [
    {
      emoji: "🥩",
      badge: { label: "Chef's Pick", type: "chef" },
      name: "Braised Short Rib",
      price: "₹1,280",
      desc: "72hr braised Angus short rib, truffle mash, red wine jus, crispy capers.",
      tags: ["Signature", "🍷 Wine Pairing"],
    },
    {
      emoji: "🐟",
      badge: { label: "New", type: "new" },
      name: "Miso Glazed Sea Bass",
      price: "₹1,120",
      desc: "Pan-seared sea bass, white miso glaze, edamame purée, pickled daikon, sesame oil.",
      tags: ["🐟 Seafood", "Gluten Free"],
    },
    {
      emoji: "🌾",
      badge: { label: "Popular", type: "pop" },
      name: "Wild Mushroom Risotto",
      price: "₹880",
      desc: "Arborio rice, foraged wild mushrooms, parmesan foam, truffle oil, chives.",
      tags: ["Vegetarian", "🌿 Earthy"],
    },
  ],
  Desserts: [
    {
      emoji: "🍮",
      badge: { label: "Chef's Pick", type: "chef" },
      name: "Burnt Basque Cheesecake",
      price: "₹420",
      desc: "San Sebastian-style burnt cheesecake, seasonal fruit compote, candied orange peel.",
      tags: ["Vegetarian", "🍊 Seasonal"],
    },
    {
      emoji: "🍫",
      badge: { label: "Popular", type: "pop" },
      name: "Dark Chocolate Fondant",
      price: "₹380",
      desc: "72% Valrhona chocolate fondant, salted caramel center, vanilla bean ice cream.",
      tags: ["Vegetarian", "🍫 Indulgent"],
    },
    {
      emoji: "🌸",
      badge: { label: "New", type: "new" },
      name: "Rose Panna Cotta",
      price: "₹340",
      desc: "Delicate rose-infused panna cotta, raspberry coulis, dried flower petals, pistachio crumble.",
      tags: ["🌿 Vegan", "Gluten Free"],
    },
  ],
  Drinks: [
    {
      emoji: "🍹",
      badge: { label: "Popular", type: "pop" },
      name: "Terra Signature Spritz",
      price: "₹320",
      desc: "Elderflower cordial, yuzu, sparkling water, fresh basil, cucumber ribbon.",
      tags: ["Non-Alcoholic", "🌿 Fresh"],
    },
    {
      emoji: "🍸",
      badge: { label: "New", type: "new" },
      name: "Smoked Negroni",
      price: "₹480",
      desc: "Campari, sweet vermouth, gin, hand-smoked with cherry wood, orange twist.",
      tags: ["Cocktail", "🍊 Bitter-Sweet"],
    },
    {
      emoji: "🫖",
      badge: { label: "Chef's Pick", type: "chef" },
      name: "Cold Brew Chai",
      price: "₹220",
      desc: "House-blended masala cold brew, oat milk, cardamom foam, edible gold dust.",
      tags: ["Non-Alcoholic", "☕ Chai"],
    },
  ],
}

const badgeStyles: Record<string, React.CSSProperties> = {
  chef: { background: "var(--color-accent)",   color: "var(--color-accent-fg)" },
  new:  { background: "var(--color-primary)",  color: "var(--color-primary-fg)" },
  pop:  { background: "var(--color-warning)",  color: "#fff" },
}

export default function MenuSection() {
  const tabs = Object.keys(menuData)
  const [active, setActive] = useState(tabs[0])
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cards = gridRef.current?.querySelectorAll(".menu-card-reveal")
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
      { threshold: 0.08 }
    )
    cards.forEach((card, i) => {
      ;(card as HTMLElement).style.opacity = "0"
      ;(card as HTMLElement).style.transform = "translateY(24px)"
      ;(card as HTMLElement).style.transition = `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`
      observer.observe(card)
    })
    return () => observer.disconnect()
  }, [active])

  return (
    <section id="menu" className="px-[5%] py-[100px]">
      {/* Header row */}
      <div
        className="flex items-end justify-between mb-14 gap-6 flex-wrap"
      >
        <div>
          <p
            className="text-[11px] font-semibold tracking-[4px] uppercase mb-3"
            style={{ color: "var(--color-primary)" }}
          >
            Seasonal Favourites
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
            {"Today's "}
            <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>Highlights</em>
          </h2>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1.5 rounded-[10px] p-1"
          style={{
            background: "var(--color-background-subtle)",
            border: "1px solid var(--color-border)",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className="px-[18px] py-2 rounded-[7px] text-[13px] font-medium cursor-pointer transition-all duration-200"
              style={{
                border: "none",
                fontFamily: "var(--font-sans)",
                background: active === tab ? "var(--color-card)" : "transparent",
                color: active === tab ? "var(--color-foreground)" : "var(--color-text-muted)",
                boxShadow: active === tab ? "var(--shadow-sm)" : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div
        ref={gridRef}
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}
      >
        {menuData[active].map((item) => (
          <div
            key={item.name}
            className="menu-card-reveal rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.transform = "translateY(-3px)"
              el.style.boxShadow = "var(--shadow-lg)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.transform = ""
              el.style.boxShadow = ""
            }}
          >
            {/* Image area */}
            <div
              className="w-full relative flex items-center justify-center text-[64px] overflow-hidden"
              style={{
                aspectRatio: "4/3",
                background: "var(--color-background-subtle)",
              }}
            >
              {item.emoji}
              {/* Gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, transparent 50%, color-mix(in srgb, var(--color-background) 30%, transparent))",
                }}
              />
              {/* Badge */}
              <span
                className="absolute top-3 left-3 text-[10px] font-semibold tracking-[1px] uppercase px-2.5 py-1 rounded-full z-10"
                style={badgeStyles[item.badge.type]}
              >
                {item.badge.label}
              </span>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-1.5">
                <div
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-serif)", color: "var(--color-foreground)" }}
                >
                  {item.name}
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  {item.price}
                </div>
              </div>
              <p
                className="text-[13px] leading-[1.6] mb-3.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {item.desc}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium px-2 py-0.5 rounded tracking-[0.5px]"
                    style={{
                      background: "var(--color-background-subtle)",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Full Menu */}
      <div className="text-center mt-11">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 rounded-[10px] text-sm font-semibold tracking-[0.3px] no-underline transition-all duration-200"
          style={{
            padding: "13px 32px",
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
          View Full Menu →
        </a>
      </div>
    </section>
  )
}
