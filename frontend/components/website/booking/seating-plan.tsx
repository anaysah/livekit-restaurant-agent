import { useState, useEffect } from "react";

/* ─────────────────────────────────────────
   TABLE DATA
───────────────────────────────────────── */
const TABLES = [
  { id: 1,  seats: 2, x: 60,  y: 60,  w: 52, h: 52 },
  { id: 2,  seats: 2, x: 140, y: 60,  w: 52, h: 52 },
  { id: 3,  seats: 2, x: 220, y: 60,  w: 52, h: 52 },
  { id: 4,  seats: 2, x: 300, y: 60,  w: 52, h: 52 },
  { id: 5,  seats: 2, x: 380, y: 60,  w: 52, h: 52 },
  { id: 6,  seats: 2, x: 460, y: 60,  w: 52, h: 52 },
  { id: 7,  seats: 2, x: 540, y: 60,  w: 52, h: 52 },
  { id: 8,  seats: 2, x: 620, y: 60,  w: 52, h: 52 },
  { id: 9,  seats: 4, x: 70,  y: 175, w: 70, h: 70 },
  { id: 10, seats: 4, x: 185, y: 175, w: 70, h: 70 },
  { id: 11, seats: 4, x: 300, y: 175, w: 70, h: 70 },
  { id: 12, seats: 4, x: 415, y: 175, w: 70, h: 70 },
  { id: 13, seats: 5, x: 90,  y: 310, w: 80, h: 80 },
  { id: 14, seats: 5, x: 255, y: 310, w: 80, h: 80 },
  { id: 15, seats: 6, x: 95,  y: 440, w: 100, h: 68 },
  { id: 16, seats: 6, x: 265, y: 440, w: 100, h: 68 },
];

const BOOKED = new Set([2, 9, 14]);

/* ─────────────────────────────────────────
   TERRA EARTHY PALETTE
───────────────────────────────────────── */
const PALETTE = {
  2: {
    light: { color: "#C4613A", fill: "#FAEAE2", text: "#9A3F1F", chip: "#C4613A", chipText: "#fff",    label: "Duo"     },
    dark:  { color: "#E07A52", fill: "#2D180E", text: "#F0A882", chip: "#E07A52", chipText: "#141009", label: "Duo"     },
  },
  4: {
    light: { color: "#6B7C45", fill: "#EDF0E1", text: "#4A5A28", chip: "#6B7C45", chipText: "#fff",    label: "Table"   },
    dark:  { color: "#8A9E5C", fill: "#1C2210", text: "#B4C882", chip: "#8A9E5C", chipText: "#141009", label: "Table"   },
  },
  5: {
    light: { color: "#9B7A3A", fill: "#F5EDD8", text: "#6D5218", chip: "#9B7A3A", chipText: "#fff",    label: "Social"  },
    dark:  { color: "#C49A52", fill: "#261C08", text: "#DEC088", chip: "#C49A52", chipText: "#141009", label: "Social"  },
  },
  6: {
    light: { color: "#7A5C4A", fill: "#EEE4DC", text: "#543C2C", chip: "#7A5C4A", chipText: "#fff",    label: "Banquet" },
    dark:  { color: "#A87A62", fill: "#221510", text: "#D4A48A", chip: "#A87A62", chipText: "#141009", label: "Banquet" },
  },
};

const FILTER_OPTS = [
  { val: 0, label: "All" },
  { val: 2, label: "2 Seats" },
  { val: 4, label: "4 Seats" },
  { val: 5, label: "5 Seats" },
  { val: 6, label: "6 Seats" },
];

/* ─────────────────────────────────────────
   CHAIR POSITIONS
───────────────────────────────────────── */
function getChairs({ x, y, w, h, seats }) {
  const cx = x + w / 2, cy = y + h / 2, r = 9;
  if (seats === 2) return [
    { cx: cx - 13, cy: y - r - 2 }, { cx: cx + 13, cy: y - r - 2 },
    { cx: cx - 13, cy: y + h + r + 2 }, { cx: cx + 13, cy: y + h + r + 2 },
  ];
  if (seats === 4) return [
    { cx, cy: y - r - 2 }, { cx, cy: y + h + r + 2 },
    { cx: x - r - 2, cy }, { cx: x + w + r + 2, cy },
  ];
  if (seats === 5) {
    const rad = w / 2 + r + 5;
    return Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return { cx: cx + Math.cos(a) * rad, cy: cy + Math.sin(a) * rad };
    });
  }
  return [
    { cx: cx - 28, cy: y - r - 2 }, { cx, cy: y - r - 2 }, { cx: cx + 28, cy: y - r - 2 },
    { cx: cx - 28, cy: y + h + r + 2 }, { cx, cy: y + h + r + 2 }, { cx: cx + 28, cy: y + h + r + 2 },
  ];
}

/* ─────────────────────────────────────────
   DARK THEME HOOK
───────────────────────────────────────── */
function useIsDark() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.dataset.theme === "dark")
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ─────────────────────────────────────────
   TABLE SVG UNIT
───────────────────────────────────────── */
function TableUnit({ table, selected, booked, onClick, show, isDark }) {
  const p       = isDark ? PALETTE[table.seats].dark : PALETTE[table.seats].light;
  const cx      = table.x + table.w / 2;
  const cy      = table.y + table.h / 2;
  const isRound = table.seats === 5;
  const chairs  = getChairs(table);

  const bookedFill   = isDark ? "#1E1710" : "#F3EDE3";
  const bookedStroke = isDark ? "#3A2E22" : "#D5C8B5";
  const bookedText   = isDark ? "#3A2E22" : "#C0AD97";
  const bookedChair  = isDark ? "#251D14" : "#EDE4D8";

  const tFill   = booked ? bookedFill   : selected ? p.color   : isDark ? "#1E1710" : "#FFFFFF";
  const tStroke = booked ? bookedStroke : p.color;
  const tText   = booked ? bookedText   : selected ? p.chipText : p.text;
  const cFill   = booked ? bookedChair  : p.fill;
  const cStroke = booked ? bookedStroke : p.color;

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
      {selected && !booked && (isRound
        ? <circle cx={cx} cy={cy} r={table.w / 2 + 13} fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />
        : <rect x={table.x - 10} y={table.y - 10} width={table.w + 20} height={table.h + 20} rx={10}
            fill="none" stroke={p.color} strokeWidth={1.5} opacity={0.4} strokeDasharray="5 4" />
      )}

      {chairs.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={9} fill={cFill} stroke={cStroke} strokeWidth={1.5} />
      ))}

      {isRound
        ? <circle cx={cx} cy={cy} r={table.w / 2} fill={tFill} stroke={tStroke} strokeWidth={selected ? 2.5 : 1.5} />
        : <rect x={table.x} y={table.y} width={table.w} height={table.h} rx={5}
            fill={tFill} stroke={tStroke} strokeWidth={selected ? 2.5 : 1.5} />
      }

      <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="middle"
        fontSize={12} fontWeight="700" fill={tText} fontFamily="ui-sans-serif, system-ui">
        T{table.id}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle"
        fontSize={9.5} fill={tText} opacity={0.65} fontFamily="ui-sans-serif, system-ui">
        {booked ? "Taken" : `${table.seats} seats`}
      </text>
    </g>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function SeatingPlan({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState(0);
  const [visible, setVisible]   = useState(new Set());
  const isDark = useIsDark();

  useEffect(() => {
    TABLES.forEach((t, i) =>
      setTimeout(() => setVisible(v => new Set([...v, t.id])), i * 50)
    );
  }, []);

  const toggle = (id) => {
    const next = selected === id ? null : id;
    setSelected(next);
    onSelect?.(next ? TABLES.find(t => t.id === next) : null);
  };

  const sel       = TABLES.find(t => t.id === selected);
  const selP      = sel ? (isDark ? PALETTE[sel.seats].dark : PALETTE[sel.seats].light) : null;
  const available = TABLES.filter(t => !BOOKED.has(t.id)).length;

  // SVG environment colors — follow Terra theme
  const svgBg     = isDark ? "#141009" : "#FAF7F2";
  const wallColor = isDark ? "#2C2218" : "#E2D5C3";
  const divColor  = isDark ? "#251D14" : "#EDE4D8";
  const zoneColor = isDark ? "#3A2E22" : "#C0AD97";
  const winFill   = isDark ? "#2D180E" : "#FAEAE2";
  const winStroke = isDark ? "#7A3A20" : "#E0A888";
  const barBg     = isDark ? "#1E1710" : "#F3EDE3";
  const entryFill = isDark ? "#2C2218" : "#3A2E22";
  const entryText = isDark ? "#3A2E22" : "#A8937E";
  const plantFill = isDark ? "#1C2210" : "#EDF0E1";
  const plantRing = isDark ? "#3A4A20" : "#B4C882";

  return (
    <div className="bg-card rounded-2xl p-5 max-w-3xl border border-border shadow-lg transition-colors duration-300 font-sans">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2
            className="text-2xl font-bold text-foreground tracking-tight"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
          >
            Dining Floor
          </h2>
          <p className="text-[11px] text-text-muted mt-1 tracking-[3px] uppercase">
            Select your table
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: "var(--color-success)" }}>{available}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">Free</div>
          </div>
          <div className="w-px h-7 bg-border" />
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: "var(--color-danger)" }}>{BOOKED.size}</div>
            <div className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">Taken</div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTER_OPTS.map(opt => {
          const active = filter === opt.val;
          const p = opt.val ? (isDark ? PALETTE[opt.val].dark : PALETTE[opt.val].light) : null;
          return (
            <button
              key={opt.val}
              onClick={() => { setFilter(opt.val); setSelected(null); }}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer tracking-wide"
              style={active && p
                ? { background: p.chip, color: p.chipText, borderColor: p.chip }
                : active
                ? { background: "var(--color-foreground)", color: "var(--color-background)", borderColor: "var(--color-foreground)" }
                : { background: "var(--color-background-subtle)", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Floor SVG */}
      <div className="relative mb-4">
        <p className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] tracking-[4px] uppercase pointer-events-none select-none z-10"
          style={{ color: winStroke }}>
          ❖ Window Seating ❖
        </p>

        <svg
          viewBox="0 0 740 560"
          className="w-full rounded-xl border border-border block transition-colors duration-300"
          style={{ background: svgBg }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle dot-grid floor texture */}
          {Array.from({ length: 11 }, (_, col) =>
            Array.from({ length: 9 }, (_, row) => (
              <circle key={`${col}-${row}`} cx={35 + col * 67} cy={58 + row * 55}
                r={1} fill={wallColor} opacity={0.5} />
            ))
          )}

          <rect x="28" y="28" width="684" height="504" fill="none" stroke={wallColor} strokeWidth="2.5" rx="5" />

          {/* Window strips */}
          {[62, 142, 222, 302, 382, 462, 542, 622].map(wx => (
            <rect key={wx} x={wx - 20} y={26} width={50} height={5} rx={2}
              fill={winFill} stroke={winStroke} strokeWidth={1} />
          ))}

          {/* Zone dividers */}
          <line x1="38" y1="155" x2="702" y2="155" stroke={divColor} strokeWidth="1.5" strokeDasharray="7 5" />
          <line x1="38" y1="285" x2="432" y2="285" stroke={divColor} strokeWidth="1.5" strokeDasharray="7 5" />
          <line x1="38" y1="415" x2="432" y2="415" stroke={divColor} strokeWidth="1.5" strokeDasharray="7 5" />

          {/* Zone labels */}
          {[["WINDOW", 714, 100], ["FAMILY", 714, 225], ["SOCIAL", 714, 358], ["BANQUET", 714, 465]].map(([label, x, y]) => (
            <text key={label} x={x} y={y} fontSize={9} fill={zoneColor}
              fontFamily="sans-serif" transform={`rotate(90,${x},${y})`} letterSpacing={2}>{label}</text>
          ))}

          {/* Bar area */}
          <rect x="528" y="168" width="164" height="305" rx="8" fill={barBg} stroke={divColor} strokeWidth="1.5" />
          <text x="610" y="298" textAnchor="middle" fontSize={22}>🍸</text>
          <text x="610" y="318" textAnchor="middle" fontSize={10} fill={zoneColor} fontFamily="sans-serif" letterSpacing={3}>BAR</text>
          <line x1="538" y1="268" x2="682" y2="268" stroke={divColor} strokeWidth="1" strokeDasharray="4 3" />
          <text x="610" y="356" textAnchor="middle" fontSize={9} fill={zoneColor} opacity={0.7} fontFamily="sans-serif">Open Kitchen</text>
          <text x="610" y="372" textAnchor="middle" fontSize={16}>👨‍🍳</text>

          {/* Plants */}
          {[390, 468].map(py => (
            <g key={py}>
              <circle cx={50} cy={py} r={13} fill={plantFill} stroke={plantRing} strokeWidth={1.5} />
              <text x={50} y={py + 5} textAnchor="middle" fontSize={14}>🌿</text>
            </g>
          ))}

          {/* Entry */}
          <rect x="328" y="524" width="84" height="7" rx="3" fill={entryFill} />
          <text x="370" y="548" textAnchor="middle" fontSize={9} fill={entryText}
            fontFamily="sans-serif" letterSpacing={3}>ENTRY</text>

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

        {/* Legend */}
        <div
          className="absolute bottom-3 right-3 rounded-xl border border-border px-3 py-2.5 flex flex-col gap-2 backdrop-blur-sm"
          style={{ background: isDark ? "rgba(20,16,9,0.9)" : "rgba(255,255,255,0.9)" }}
        >
          {Object.entries(PALETTE).map(([s, variants]) => {
            const p = isDark ? variants.dark : variants.light;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-[10px] text-text-secondary">
                  {s} seat · <span className="text-text-muted">{p.label}</span>
                </span>
              </div>
            );
          })}
          <div className="h-px bg-border-light" />
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-border" />
            <span className="text-[10px] text-text-muted">Booked</span>
          </div>
        </div>
      </div>

      {/* Selection bar */}
      <div
        className="flex items-center justify-between rounded-xl border px-4 py-3 min-h-[58px] transition-all duration-300"
        style={sel && selP
          ? { background: selP.fill, borderColor: selP.color + "70" }
          : { background: "var(--color-background-subtle)", borderColor: "var(--color-border)" }
        }
      >
        {sel && selP ? (
          <>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: selP.color, color: selP.chipText }}
              >
                T{sel.id}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: selP.text }}>
                  Table {sel.id} — {selP.label} · {sel.seats} Seats
                </div>
                <div className="text-xs text-text-muted mt-0.5">Full table · Exclusive reservation</div>
              </div>
            </div>
            <button
              onClick={() => toggle(sel.id)}
              className="text-xs font-medium border rounded-lg px-3 py-1.5 bg-transparent cursor-pointer hover:opacity-60 transition-opacity shrink-0"
              style={{ borderColor: selP.color + "60", color: selP.text }}
            >
              Clear
            </button>
          </>
        ) : (
          <p className="text-sm text-text-muted w-full text-center">
            Koi table click karein
          </p>
        )}
      </div>
    </div>
  );
}