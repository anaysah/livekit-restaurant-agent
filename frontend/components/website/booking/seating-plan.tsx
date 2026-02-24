"use client"

import { useState, useEffect } from "react"

type Seats = 2 | 4 | 6 | 8
type Table = { id: number; seats: Seats; x: number; y: number; w: number; h: number }
type PaletteEntry = { color: string; fill: string; text: string; chip: string; chipText: string; label: string }
type ChairPos = { cx: number; cy: number; rotate: number }

/* ═══════════════════════════════════════════════════════════
   LAYOUT PLAN  (viewBox 820 × 660)

   ┌─────────────────────────────────────────────┬──────────┐
   │  🪟 Window strip (top)                      │          │
   │  W1  W2  W3  W4  W5  W6   ← 2-seaters      │   BAR /  │
   │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   aisle           │  KITCHEN │
   │  [4] [4] [4]   [4] [4]    ← 4-seaters row1 │          │
   │                            aisle           ├──────────┤
   │  [4] [4] [4]   [4] [4]    ← 4-seaters row2 │          │
   │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   aisle           │ PRIVATE  │
   │  (6)    (6)    (6)         ← 6-seaters      │  DINING  │
   │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   aisle           │          │
   │  [═══8═══]   [═══8═══]     ← 8-seaters      │          │
   │                                             │          │
   │          ↑ ENTRY (clear zone)               │          │
   └─────────────────────────────────────────────┴──────────┘

   Entry is bottom-centre — 120px clear zone, no tables below y=570
   Main aisle runs vertically centre-left (x≈290)
   Bar right side x=570–790
═══════════════════════════════════════════════════════════ */

const TABLES: Table[] = [
  // ── Window row — 2-seaters (6 tables, along top wall) ──
  // Spaced with gap at centre for entry path to bar
  { id:  1, seats: 2, x:  48, y:  52, w: 44, h: 44 },
  { id:  2, seats: 2, x: 112, y:  52, w: 44, h: 44 },
  { id:  3, seats: 2, x: 176, y:  52, w: 44, h: 44 },
  { id:  4, seats: 2, x: 258, y:  52, w: 44, h: 44 },
  { id:  5, seats: 2, x: 322, y:  52, w: 44, h: 44 },
  { id:  6, seats: 2, x: 386, y:  52, w: 44, h: 44 },

  // ── 4-seater row 1 (below window, left block + right block with aisle) ──
  { id:  7, seats: 4, x:  48, y: 150, w: 64, h: 64 },
  { id:  8, seats: 4, x: 138, y: 150, w: 64, h: 64 },
  { id:  9, seats: 4, x: 228, y: 150, w: 64, h: 64 },
  // gap at x≈310 (centre aisle ~30px)
  { id: 10, seats: 4, x: 322, y: 150, w: 64, h: 64 },
  { id: 11, seats: 4, x: 412, y: 150, w: 64, h: 64 },

  // ── 4-seater row 2 ──
  { id: 12, seats: 4, x:  48, y: 272, w: 64, h: 64 },
  { id: 13, seats: 4, x: 138, y: 272, w: 64, h: 64 },
  { id: 14, seats: 4, x: 228, y: 272, w: 64, h: 64 },
  { id: 15, seats: 4, x: 322, y: 272, w: 64, h: 64 },
  { id: 16, seats: 4, x: 412, y: 272, w: 64, h: 64 },

  // ── 6-seater round tables (social zone) ──
  { id: 17, seats: 6, x:  55, y: 378, w: 74, h: 74 },
  { id: 18, seats: 6, x: 193, y: 378, w: 74, h: 74 },
  { id: 19, seats: 6, x: 331, y: 378, w: 74, h: 74 },

  // ── 8-seater banquet tables (away from entry, not touching bottom wall) ──
  { id: 20, seats: 8, x:  48, y: 498, w: 124, h: 56 },
  { id: 21, seats: 8, x: 218, y: 498, w: 124, h: 56 },
]

const BOOKED = new Set([2, 8, 17])

const PALETTE: Record<number, { light: PaletteEntry; dark: PaletteEntry }> = {
  2: {
    light: { color: "#C4613A", fill: "#FAEAE2", text: "#9A3F1F", chip: "#C4613A", chipText: "#fff",    label: "Duo"     },
    dark:  { color: "#E07A52", fill: "#2D180E", text: "#F0A882", chip: "#E07A52", chipText: "#141009", label: "Duo"     },
  },
  4: {
    light: { color: "#6B7C45", fill: "#EDF0E1", text: "#4A5A28", chip: "#6B7C45", chipText: "#fff",    label: "Classic" },
    dark:  { color: "#8A9E5C", fill: "#1C2210", text: "#B4C882", chip: "#8A9E5C", chipText: "#141009", label: "Classic" },
  },
  6: {
    light: { color: "#9B7A3A", fill: "#F5EDD8", text: "#6D5218", chip: "#9B7A3A", chipText: "#fff",    label: "Social"  },
    dark:  { color: "#C49A52", fill: "#261C08", text: "#DEC088", chip: "#C49A52", chipText: "#141009", label: "Social"  },
  },
  8: {
    light: { color: "#7A5C4A", fill: "#EEE4DC", text: "#543C2C", chip: "#7A5C4A", chipText: "#fff",    label: "Banquet" },
    dark:  { color: "#A87A62", fill: "#221510", text: "#D4A48A", chip: "#A87A62", chipText: "#141009", label: "Banquet" },
  },
}

const FILTER_OPTS = [
  { val: 0, label: "All"     },
  { val: 2, label: "2 Seats" },
  { val: 4, label: "4 Seats" },
  { val: 6, label: "6 Seats" },
  { val: 8, label: "8 Seats" },
]

function getChairs(t: Table): ChairPos[] {
  const cx  = t.x + t.w / 2
  const cy  = t.y + t.h / 2
  const gap = 3
  const ch  = 5

  const top    = t.y - gap - ch / 2
  const bottom = t.y + t.h + gap + ch / 2
  const left   = t.x - gap - ch / 2
  const right  = t.x + t.w + gap + ch / 2

  if (t.seats === 2) return [
    { cx, cy: top,    rotate: 0  },
    { cx, cy: bottom, rotate: 0  },
  ]

  if (t.seats === 4) return [
    { cx,       cy: top,    rotate: 0  },
    { cx,       cy: bottom, rotate: 0  },
    { cx: left,  cy,        rotate: 90 },
    { cx: right, cy,        rotate: 90 },
  ]

  if (t.seats === 6) {
    const rad = t.w / 2 + gap + ch / 2
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      return {
        cx: cx + Math.cos(a) * rad,
        cy: cy + Math.sin(a) * rad,
        rotate: (a * 180) / Math.PI + 90,
      }
    })
  }

  const off = [-36, 0, 36]
  return [
    ...off.map(dx => ({ cx: cx + dx, cy: top,    rotate: 0  })),
    ...off.map(dx => ({ cx: cx + dx, cy: bottom, rotate: 0  })),
    { cx: left,  cy, rotate: 90 },
    { cx: right, cy, rotate: 90 },
  ]
}

function useIsDark(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
  )
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.dataset.theme === "dark")
    )
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => obs.disconnect()
  }, [])
  return dark
}

type TableUnitProps = {
  table: Table; selected: boolean; booked: boolean
  onClick: () => void; show: boolean; isDark: boolean
}

function TableUnit({ table, selected, booked, onClick, show, isDark }: TableUnitProps) {
  const p      = isDark ? PALETTE[table.seats].dark : PALETTE[table.seats].light
  const cx     = table.x + table.w / 2
  const cy     = table.y + table.h / 2
  const round  = table.seats === 6
  const chairs = getChairs(table)

  const bkFill   = isDark ? "#1E1710" : "#F3EDE3"
  const bkStroke = isDark ? "#3A2E22" : "#D5C8B5"
  const bkText   = isDark ? "#3A2E22" : "#C0AD97"
  const bkChair  = isDark ? "#251D14" : "#EDE4D8"

  const tFill   = booked ? bkFill   : selected ? p.color   : isDark ? "#1E1710" : "#FFFFFF"
  const tStroke = booked ? bkStroke : p.color
  const tText   = booked ? bkText   : selected ? p.chipText : p.text
  const cFill   = booked ? bkChair  : p.fill
  const cStroke = booked ? bkStroke : p.color

  return (
    <g
      onClick={booked ? undefined : onClick}
      style={{
        cursor: booked ? "not-allowed" : "pointer",
        opacity: show ? 1 : 0,
        transform: show ? "scale(1)" : "scale(0.7)",
        transformOrigin: `${cx}px ${cy}px`,
        transition: "opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Selection halo */}
      {selected && !booked && (round
        ? <circle cx={cx} cy={cy} r={table.w / 2 + 13}
            fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />
        : <rect x={table.x - 9} y={table.y - 9} width={table.w + 18} height={table.h + 18} rx={9}
            fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />
      )}

      {chairs.map((c, i) => (
        <rect
          key={i}
          x={c.cx - 9} y={c.cy - 2.5}
          width={18} height={5}
          rx={2}
          fill={cFill} stroke={cStroke} strokeWidth={1.2}
          transform={`rotate(${c.rotate}, ${c.cx}, ${c.cy})`}
        />
      ))}

      {round
        ? <circle cx={cx} cy={cy} r={table.w / 2}
            fill={tFill} stroke={tStroke} strokeWidth={selected ? 2.5 : 1.5} />
        : <rect x={table.x} y={table.y} width={table.w} height={table.h} rx={5}
            fill={tFill} stroke={tStroke} strokeWidth={selected ? 2.5 : 1.5} />
      }

      <text x={cx} y={cy - 5} textAnchor="middle" dominantBaseline="middle"
        fontSize={10.5} fontWeight="700" fill={tText} fontFamily="ui-sans-serif, system-ui">
        T{table.id}
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={8.5} fill={tText} opacity={0.6} fontFamily="ui-sans-serif, system-ui">
        {booked ? "Taken" : `${table.seats} seats`}
      </text>
    </g>
  )
}

type SeatingPlanProps = { onSelect?: (table: Table | null) => void }

export default function SeatingPlan({ onSelect }: SeatingPlanProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [filter,   setFilter]   = useState(0)
  const [visible,  setVisible]  = useState<Set<number>>(new Set())
  const isDark = useIsDark()

  useEffect(() => {
    TABLES.forEach((t, i) =>
      setTimeout(() => setVisible(v => new Set([...v, t.id])), i * 45)
    )
  }, [])

  const toggle = (id: number) => {
    const next = selected === id ? null : id
    setSelected(next)
    onSelect?.(next ? (TABLES.find(t => t.id === next) ?? null) : null)
  }

  const sel  = TABLES.find(t => t.id === selected) ?? null
  const selP = sel ? (isDark ? PALETTE[sel.seats].dark : PALETTE[sel.seats].light) : null

  // Theme tokens for SVG environment
  const svgBg     = isDark ? "#141009" : "#FAF7F2"
  const wall      = isDark ? "#2C2218" : "#DECCB8"
  const div       = isDark ? "#251D14" : "#EAD9C6"
  const zoneClr   = isDark ? "#4A3828" : "#C0A488"
  const winFill   = isDark ? "#2D180E" : "#FAEAE2"
  const winStroke = isDark ? "#7A3A20" : "#DDA080"
  const barBg     = isDark ? "#1A1208" : "#F0E8DC"
  const plantFill = isDark ? "#1C2210" : "#E8F0DC"
  const plantRing = isDark ? "#3A4A20" : "#A8C070"
  const entryFill = isDark ? "#2C2218" : "#4A3828"
  const entryText = isDark ? "#5A4838" : "#A89080"

  return (
    <div
      className="rounded-lg border transition-colors duration-300 h-full flex flex-col overflow-hidden"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >
      {/* Floor plan */}
      <div className="relative flex-1 min-h-0">

        {/* Window hint */}
        <p className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none
                      text-[8px] tracking-[4px] uppercase"
           style={{ color: winStroke }}>
          ❖ Window Seating ❖
        </p>

        <svg
          viewBox="0 0 562 660"
          className="w-full h-full block"
          style={{ background: "var(--color-card)" }}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle dot-grid floor texture */}
          {Array.from({ length: 13 }, (_, col) =>
            Array.from({ length: 11 }, (_, row) => (
              <circle key={`${col}-${row}`}
                cx={36 + col * 62} cy={36 + row * 58}
                r={0.9} fill={wall} opacity={0.5} />
            ))
          )}

          {/* Outer walls */}
          <rect x="26" y="26" width="510" height="608" 
            fill="#FAF7F2" stroke={wall} strokeWidth="2.5" rx="5" />

          {/* ── Top wall windows ── */}
          {[52, 116, 180, 262, 326, 390].map(wx => (
            <rect key={wx} x={wx} y={24} width={40} height={5} rx={2}
              fill={winFill} stroke={winStroke} strokeWidth={1} />
          ))}

          {/* ── Right-side WALL separating tables from bar ── */}
          {/* <line x1="568" y1="30" x2="568" y2="630"
            stroke={wall} strokeWidth="1.8" /> */}

          {/* ── Zone dividers (left section only) ── */}
          {/* Below window row */}
          <line x1="34" y1="130" x2="528" y2="130"
            stroke={div} strokeWidth="1.2" strokeDasharray="6 5" />
          {/* Between 4-seater rows */}
          <line x1="34" y1="250" x2="528" y2="250"
            stroke={div} strokeWidth="1.2" strokeDasharray="6 5" />
          {/* Below 4-seater zone */}
          <line x1="34" y1="366" x2="528" y2="366"
            stroke={div} strokeWidth="1.2" strokeDasharray="6 5" />
          {/* Below 6-seater zone */}
          <line x1="34" y1="480" x2="528" y2="480"
            stroke={div} strokeWidth="1.2" strokeDasharray="6 5" />

          {/* ── Zone labels — small, left-aligned, above each zone ── */}
          {[
            ["🪟 WINDOW",  34, 125 ],
            ["CASUAL",     34, 245 ],
            ["SOCIAL",     34, 360 ],
            ["BANQUET",    34, 474 ],
          ].map(([label, x, y]) => (
            <text key={label as string} x={x as number} y={y as number}
              fontSize={7.5} fill={zoneClr} fontFamily="ui-sans-serif"
              letterSpacing={2} fontWeight="600" opacity={0.8}>
              {label as string}
            </text>
          ))}

          {/* ── Centre aisle hint — very subtle vertical guide ── */}
          <line x1="302" y1="148" x2="302" y2="480"
            stroke={div} strokeWidth="0.8" strokeDasharray="3 8" opacity={0.5} />

          {/* ── BAR + KITCHEN (right side, full height) ── */}
          {/* Bar top section */}
          {/* <rect x="576" y="34" width="210" height="240" rx="6"
            fill={barBg} stroke={div} strokeWidth="1.2" />
          <text x="681" y="135" textAnchor="middle" fontSize={28}>🍸</text>
          <text x="681" y="160" textAnchor="middle" fontSize={9}
            fill={zoneClr} fontFamily="sans-serif" letterSpacing={3}>BAR</text>
          <line x1="584" y1="182" x2="778" y2="182"
            stroke={div} strokeWidth="0.8" strokeDasharray="4 3" />
          <text x="681" y="202" textAnchor="middle" fontSize={8}
            fill={zoneClr} opacity={0.7} fontFamily="sans-serif">Open Kitchen</text>
          <text x="681" y="222" textAnchor="middle" fontSize={20}>👨‍🍳</text> */}

          {/* Private dining (right, lower) */}
          {/* <rect x="576" y="290" width="210" height="348" rx="6"
            fill={barBg} stroke={div} strokeWidth="1.2" />
          <text x="681" y="450" textAnchor="middle" fontSize={22}>🕯️</text>
          <text x="681" y="474" textAnchor="middle" fontSize={8}
            fill={zoneClr} fontFamily="sans-serif" letterSpacing={2}>PRIVATE DINING</text> */}

          {/* ── Plants — corners & aisle break ── */}
          {/* {[
            [500, 400], [500, 510], [34, 400], [34, 510],
          ].map(([px, py]) => (
            <g key={`${px}-${py}`}>
              <circle cx={px} cy={py} r={11} fill={plantFill} stroke={plantRing} strokeWidth={1.3} />
              <text x={px} y={py + 4} textAnchor="middle" fontSize={12}>🌿</text>
            </g>
          ))} */}

          {/* ── Entry zone — bottom centre, clearly open ── */}
          {/* Entry walkway shading — subtle */}
          {/* <rect x="300" y="572" width="148" height="58" rx="4"
            fill={isDark ? "#1A1208" : "#F5EFE7"} opacity={0.6} /> */}
          {/* Entry marker bar */}
          <rect x="400" y="624" width="72" height="6" rx="3" fill={entryFill} />
          <text x="437" y="642" textAnchor="middle" fontSize={8}
            fill={entryText} fontFamily="sans-serif" letterSpacing={3}>ENTRY</text>

          {/* ── Tables ── */}
          {TABLES.map(t => (
            <TableUnit
              key={t.id}
              table={t}
              selected={selected === t.id}
              booked={BOOKED.has(t.id)}
              onClick={() => toggle(t.id)}
              show={visible.has(t.id) && (filter === 0 || t.seats === filter)}
              isDark={isDark}
            />
          ))}
        </svg>
      </div>

      {/* ── Selection bar ── */}
      {/* <div
        className="flex items-center justify-between px-4 py-2.5 border-t shrink-0 transition-all duration-300"
        style={sel && selP
          ? { background: selP.fill, borderColor: selP.color + "55" }
          : { background: "var(--color-background-subtle)", borderColor: "var(--color-border)" }
        }
      >
        {sel && selP ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                   style={{ background: selP.color, color: selP.chipText }}>
                T{sel.id}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: selP.text }}>
                  Table {sel.id} — {selP.label} · {sel.seats} Seats
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  Full table reservation
                </div>
              </div>
            </div>
            <button
              onClick={() => toggle(sel.id)}
              className="text-xs font-medium border rounded-lg px-3 py-1.5 bg-transparent cursor-pointer hover:opacity-60 transition-opacity shrink-0"
              style={{ borderColor: selP.color + "50", color: selP.text }}
            >
              Clear
            </button>
          </>
        ) : (
          <p className="text-sm w-full text-center" style={{ color: "var(--color-text-muted)" }}>
            Click a table to select it
          </p>
        )}
      </div> */}
    </div>
  )
}