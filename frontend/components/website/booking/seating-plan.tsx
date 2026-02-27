"use client"

import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type Seats = 2 | 4 | 6 | 8

type Table = {
  id:    number
  seats: Seats
  x:     number
  y:     number
  w:     number
  h:     number
}

type PaletteEntry = {
  color:    string
  fill:     string
  text:     string
  chipText: string
  label:    string
}

type ChairPos = { cx: number; cy: number; rotate: number }

// ─── Floor plan data (viewBox 562 × 660) ───────────────────────────────────────

const TABLES: Table[] = [
  // Window row — 2-seaters (along top wall)
  { id:  1, seats: 2, x:  48, y:  52, w: 44, h: 44 },
  { id:  2, seats: 2, x: 112, y:  52, w: 44, h: 44 },
  { id:  3, seats: 2, x: 176, y:  52, w: 44, h: 44 },
  { id:  4, seats: 2, x: 258, y:  52, w: 44, h: 44 },
  { id:  5, seats: 2, x: 322, y:  52, w: 44, h: 44 },
  { id:  6, seats: 2, x: 386, y:  52, w: 44, h: 44 },
  // 4-seater row 1 (left block + right block with centre aisle)
  { id:  7, seats: 4, x:  48, y: 150, w: 64, h: 64 },
  { id:  8, seats: 4, x: 138, y: 150, w: 64, h: 64 },
  { id:  9, seats: 4, x: 228, y: 150, w: 64, h: 64 },
  { id: 10, seats: 4, x: 322, y: 150, w: 64, h: 64 },
  { id: 11, seats: 4, x: 412, y: 150, w: 64, h: 64 },
  // 4-seater row 2
  { id: 12, seats: 4, x:  48, y: 272, w: 64, h: 64 },
  { id: 13, seats: 4, x: 138, y: 272, w: 64, h: 64 },
  { id: 14, seats: 4, x: 228, y: 272, w: 64, h: 64 },
  { id: 15, seats: 4, x: 322, y: 272, w: 64, h: 64 },
  { id: 16, seats: 4, x: 412, y: 272, w: 64, h: 64 },
  // 6-seater round tables (social zone)
  { id: 17, seats: 6, x:  55, y: 378, w: 74, h: 74 },
  { id: 18, seats: 6, x: 193, y: 378, w: 74, h: 74 },
  { id: 19, seats: 6, x: 331, y: 378, w: 74, h: 74 },
  // 8-seater banquet tables
  { id: 20, seats: 8, x:  48, y: 498, w: 124, h: 56 },
  { id: 21, seats: 8, x: 218, y: 498, w: 124, h: 56 },
]

// ─── Colour palette (light / dark variant per seat count) ─────────────────────

const PALETTE: Record<Seats, { light: PaletteEntry; dark: PaletteEntry }> = {
  2: {
    light: { color: "#C4613A", fill: "#FAEAE2", text: "#9A3F1F", chipText: "#fff",    label: "Duo"     },
    dark:  { color: "#E07A52", fill: "#2D180E", text: "#F0A882", chipText: "#141009", label: "Duo"     },
  },
  4: {
    light: { color: "#6B7C45", fill: "#EDF0E1", text: "#4A5A28", chipText: "#fff",    label: "Classic" },
    dark:  { color: "#8A9E5C", fill: "#1C2210", text: "#B4C882", chipText: "#141009", label: "Classic" },
  },
  6: {
    light: { color: "#9B7A3A", fill: "#F5EDD8", text: "#6D5218", chipText: "#fff",    label: "Social"  },
    dark:  { color: "#C49A52", fill: "#261C08", text: "#DEC088", chipText: "#141009", label: "Social"  },
  },
  8: {
    light: { color: "#7A5C4A", fill: "#EEE4DC", text: "#543C2C", chipText: "#fff",    label: "Banquet" },
    dark:  { color: "#A87A62", fill: "#221510", text: "#D4A48A", chipText: "#141009", label: "Banquet" },
  },
}

// dark + neon use dark palette; light + pink use light palette
const DARK_THEMES = new Set(["dark", "neon"])

// ─── Filter options ────────────────────────────────────────────────────────────

const FILTER_OPTS = [
  { val: 0, label: "All"     },
  { val: 2, label: "2 Seats" },
  { val: 4, label: "4 Seats" },
  { val: 6, label: "6 Seats" },
  { val: 8, label: "8 Seats" },
]

// ─── Chair geometry helper ─────────────────────────────────────────────────────

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
    { cx,        cy: top,    rotate: 0  },
    { cx,        cy: bottom, rotate: 0  },
    { cx: left,  cy,         rotate: 90 },
    { cx: right, cy,         rotate: 90 },
  ]

  if (t.seats === 6) {
    const rad = t.w / 2 + gap + ch / 2
    return Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      return {
        cx:     cx + Math.cos(a) * rad,
        cy:     cy + Math.sin(a) * rad,
        rotate: (a * 180) / Math.PI + 90,
      }
    })
  }

  // 8-seater: 3 top + 3 bottom + 1 each side
  const off = [-36, 0, 36]
  return [
    ...off.map(dx => ({ cx: cx + dx, cy: top,    rotate: 0  })),
    ...off.map(dx => ({ cx: cx + dx, cy: bottom, rotate: 0  })),
    { cx: left,  cy, rotate: 90 },
    { cx: right, cy, rotate: 90 },
  ]
}

// ─── TableUnit ─────────────────────────────────────────────────────────────────

type TableUnitProps = {
  table:    Table
  selected: boolean
  booked:   boolean
  onClick:  () => void
  show:     boolean
  isDark:   boolean
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

  const tFill   = booked ? bkFill   : selected ? p.color    : isDark ? "#1E1710" : "#FFFFFF"
  const tStroke = booked ? bkStroke : p.color
  const tText   = booked ? bkText   : selected ? p.chipText : p.text
  const cFill   = booked ? bkChair  : p.fill
  const cStroke = booked ? bkStroke : p.color

  return (
    <g
      onClick={booked ? undefined : onClick}
      style={{
        cursor:          booked ? "not-allowed" : "pointer",
        opacity:         show ? 1 : 0,
        transform:       show ? "scale(1)" : "scale(0.7)",
        transformOrigin: `${cx}px ${cy}px`,
        transition:      "opacity 0.4s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Dashed selection halo */}
      {selected && !booked && (round
        ? <circle cx={cx} cy={cy} r={table.w / 2 + 13}
            fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />
        : <rect x={table.x - 9} y={table.y - 9} width={table.w + 18} height={table.h + 18} rx={9}
            fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />
      )}

      {/* Chairs */}
      {chairs.map((c, i) => (
        <rect key={i}
          x={c.cx - 9} y={c.cy - 2.5}
          width={18} height={5} rx={2}
          fill={cFill} stroke={cStroke} strokeWidth={1.2}
          transform={`rotate(${c.rotate}, ${c.cx}, ${c.cy})`}
        />
      ))}

      {/* Table surface */}
      {round
        ? <circle cx={cx} cy={cy} r={table.w / 2}
            fill={tFill} stroke={tStroke} strokeWidth={selected ? 2.5 : 1.5} />
        : <rect x={table.x} y={table.y} width={table.w} height={table.h} rx={5}
            fill={tFill} stroke={tStroke} strokeWidth={selected ? 2.5 : 1.5} />
      }

      {/* Table ID + seat count */}
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

// ─── SeatingPlan ───────────────────────────────────────────────────────────────

type SeatingPlanProps = {
  /** Called whenever the user selects or deselects a table */
  onSelect?:  (table: Table | null) => void
  /** Table IDs that are already booked and cannot be selected */
  bookedIds?: number[]
}

export default function SeatingPlan({
  onSelect,
  bookedIds = [2, 8, 17],
}: SeatingPlanProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [filter,   setFilter]   = useState(0)
  const [visible,  setVisible]  = useState<Set<number>>(new Set())
  const [mounted,  setMounted]  = useState(false)

  const { resolvedTheme } = useTheme()

  useEffect(() => { setMounted(true) }, [])

  // Staggered entrance animation — timers cleaned up on unmount
  useEffect(() => {
    const timers = TABLES.map((t, i) =>
      setTimeout(
        () => setVisible(v => { const n = new Set(v); n.add(t.id); return n }),
        i * 45,
      )
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const isDark = mounted ? DARK_THEMES.has(resolvedTheme ?? "") : false
  const booked = new Set(bookedIds)
  const sel    = TABLES.find(t => t.id === selected) ?? null
  const selP   = sel ? (isDark ? PALETTE[sel.seats].dark : PALETTE[sel.seats].light) : null

  const toggle = (id: number) => {
    const next = selected === id ? null : id
    setSelected(next)
    onSelect?.(next ? (TABLES.find(t => t.id === next) ?? null) : null)
  }

  // SVG colour tokens derived from current theme
  const svgBg     = isDark ? "#141009" : "#FAF7F2"
  const wall      = isDark ? "#2C2218" : "#DECCB8"
  const div       = isDark ? "#251D14" : "#EAD9C6"
  const zoneClr   = isDark ? "#4A3828" : "#C0A488"
  const winFill   = isDark ? "#2D180E" : "#FAEAE2"
  const winStroke = isDark ? "#7A3A20" : "#DDA080"
  const entryFill = isDark ? "#2C2218" : "#4A3828"
  const entryText = isDark ? "#5A4838" : "#A89080"

  return (
    <div
      className="rounded-lg border transition-colors duration-300 flex flex-col overflow-hidden"
      style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
    >

      {/* ── Filter pills ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0 flex-wrap"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span
          className="text-[10px] tracking-widest uppercase mr-1 select-none"
          style={{ color: "var(--color-text-muted)" }}
        >
          Filter
        </span>
        {FILTER_OPTS.map(opt => {
          const active = filter === opt.val
          const p = opt.val !== 0
            ? (isDark ? PALETTE[opt.val as Seats].dark : PALETTE[opt.val as Seats].light)
            : null
          return (
            <button
              key={opt.val}
              onClick={() => setFilter(opt.val)}
              className="text-[11px] px-3 py-1 rounded-full border transition-all duration-200 cursor-pointer font-medium"
              style={
                active && p
                  ? { background: p.color, borderColor: p.color, color: p.chipText }
                  : active
                  ? { background: "var(--color-primary)", borderColor: "var(--color-primary)", color: "var(--color-primary-fg)" }
                  : { background: "transparent", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* ── Floor plan SVG ────────────────────────────────────────────────────── */}
      <div className="relative w-full">

        <p
          className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none select-none
                     text-[8px] tracking-[4px] uppercase"
          style={{ color: winStroke }}
        >
          ❖ Window Seating ❖
        </p>

        <svg
          viewBox="0 0 562 660"
          className="w-full h-auto block"
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
            fill={svgBg} stroke={wall} strokeWidth="2.5" rx="5" />

          {/* Top wall windows */}
          {[52, 116, 180, 262, 326, 390].map(wx => (
            <rect key={wx} x={wx} y={24} width={40} height={5} rx={2}
              fill={winFill} stroke={winStroke} strokeWidth={1} />
          ))}

          {/* Zone dividers */}
          {[130, 250, 366, 480].map(y => (
            <line key={y} x1="34" y1={y} x2="528" y2={y}
              stroke={div} strokeWidth="1.2" strokeDasharray="6 5" />
          ))}

          {/* Zone labels */}
          {([
            ["🪟 WINDOW", 34, 125] as const,
            ["CASUAL",    34, 245] as const,
            ["SOCIAL",    34, 360] as const,
            ["BANQUET",   34, 474] as const,
          ]).map(([label, x, y]) => (
            <text key={label} x={x} y={y}
              fontSize={7.5} fill={zoneClr} fontFamily="ui-sans-serif"
              letterSpacing={2} fontWeight="600" opacity={0.8}>
              {label}
            </text>
          ))}

          {/* Centre aisle guide */}
          <line x1="302" y1="148" x2="302" y2="480"
            stroke={div} strokeWidth="0.8" strokeDasharray="3 8" opacity={0.5} />

          {/* Entry marker */}
          <rect x="400" y="624" width="72" height="6" rx="3" fill={entryFill} />
          <text x="437" y="642" textAnchor="middle"
            fontSize={8} fill={entryText} fontFamily="sans-serif" letterSpacing={3}>
            ENTRY
          </text>

          {/* Tables */}
          {TABLES.map(t => (
            <TableUnit
              key={t.id}
              table={t}
              selected={selected === t.id}
              booked={booked.has(t.id)}
              onClick={() => toggle(t.id)}
              show={visible.has(t.id) && (filter === 0 || t.seats === filter)}
              isDark={isDark}
            />
          ))}
        </svg>
      </div>

      {/* ── Selection bar ─────────────────────────────────────────────────────── */}
      
    </div>
  )
}
