// components/website/DoodleBackground.tsx
// Scattered doodle SVGs behind website content — theme-aware, purely decorative

import React from 'react'
import Image from 'next/image'

type DoodlePlacement = {
  src: string
  size: number        // width & height in px
  top: number         // px from top of page
  left: string        // css value (% or px)
  rotate: number      // degrees
}

const placements: DoodlePlacement[] = [
  // ─── Hero zone ──────────────────────────────────────────
  { src: '/doodles/soup.svg',            size: 320, top:  30,   left: '2%',   rotate: -15 },
  { src: '/doodles/pancake.svg',         size:  85, top: 180,   left: '70%',  rotate:  22 },
  { src: '/doodles/pizza.svg',           size: 260, top:  60,   left: '84%',  rotate:  10 },

  // ─── Zone 2 (~400-700px) ────────────────────────────────
  { src: '/doodles/square-sandwich.svg', size:  90, top: 420,   left: '8%',   rotate: -20 },
  { src: '/doodles/egg.svg',             size: 300, top: 380,   left: '60%',  rotate:  18 },
  { src: '/doodles/burger.svg',          size: 110, top: 650,   left: '90%',  rotate: -30 },

  // ─── Zone 3 (~750-1100px) ───────────────────────────────
  { src: '/doodles/taco.svg',            size: 280, top: 760,   left: '5%',   rotate:  25 },
  { src: '/doodles/toast.svg',           size:  80, top: 900,   left: '55%',  rotate: -10 },
  { src: '/doodles/coffee-cup.svg',      size: 230, top: 1000,  left: '78%',  rotate:  14 },

  // ─── Zone 4 (~1150-1500px) ──────────────────────────────
  { src: '/doodles/pizza-slice.svg',     size: 100, top: 1160,  left: '20%',  rotate: -22 },
  { src: '/doodles/soup.svg',            size: 340, top: 1200,  left: '65%',  rotate: -18 },
  { src: '/doodles/pancake.svg',         size: 270, top: 1400,  left: '2%',   rotate:  30 },

  // ─── Zone 5 (~1600-2000px) ──────────────────────────────
  { src: '/doodles/pizza.svg',           size:  95, top: 1620,  left: '82%',  rotate:   8 },
  { src: '/doodles/square-sandwich.svg', size: 310, top: 1680,  left: '38%',  rotate: -12 },
  { src: '/doodles/burger.svg',          size:  75, top: 1950,  left: '12%',  rotate:  20 },

  // ─── Zone 6 (~2100-2500px) ──────────────────────────────
  { src: '/doodles/egg.svg',             size: 290, top: 2100,  left: '74%',  rotate: -28 },
  { src: '/doodles/taco.svg',            size:  88, top: 2280,  left: '28%',  rotate:  15 },
  { src: '/doodles/toast.svg',           size: 250, top: 2350,  left: '6%',   rotate:  -8 },

  // ─── Zone 7 (~2600-3000px) ──────────────────────────────
  { src: '/doodles/coffee-cup.svg',      size:  78, top: 2620,  left: '88%',  rotate:  24 },
  { src: '/doodles/pizza-slice.svg',     size: 320, top: 2650,  left: '46%',  rotate: -20 },
  { src: '/doodles/soup.svg',            size: 105, top: 2900,  left: '15%',  rotate:  32 },

  // ─── Bottom zone (~3100-3600px) ─────────────────────────
  { src: '/doodles/pancake.svg',         size: 270, top: 3100,  left: '70%',  rotate: -14 },
  { src: '/doodles/square-sandwich.svg', size:  92, top: 3320,  left: '3%',   rotate:  18 },
  { src: '/doodles/pizza.svg',           size: 300, top: 3400,  left: '50%',  rotate:  10 },

  // ─── Extra small fillers ─────────────────────────────────
  { src: '/doodles/burger.svg',          size:  52, top:  260,  left: '44%',  rotate:  12 },
  { src: '/doodles/taco.svg',            size:  48, top:  510,  left: '96%',  rotate: -35 },
  { src: '/doodles/toast.svg',           size:  55, top:  720,  left: '33%',  rotate:  28 },
  { src: '/doodles/egg.svg',             size:  44, top:  960,  left: '18%',  rotate: -16 },
  { src: '/doodles/coffee-cup.svg',      size:  58, top: 1080,  left: '48%',  rotate:  40 },
  { src: '/doodles/pizza-slice.svg',     size:  50, top: 1340,  left: '91%',  rotate: -25 },
  { src: '/doodles/soup.svg',            size:  46, top: 1560,  left: '57%',  rotate:  18 },
  { src: '/doodles/pancake.svg',         size:  60, top: 1780,  left: '24%',  rotate: -38 },
  { src: '/doodles/pizza.svg',           size:  48, top: 1880,  left: '68%',  rotate:  22 },
  { src: '/doodles/square-sandwich.svg', size:  54, top: 2060,  left: '42%',  rotate: -14 },
  { src: '/doodles/burger.svg',          size:  62, top: 2200,  left: '85%',  rotate:  32 },
  { src: '/doodles/taco.svg',            size:  50, top: 2460,  left: '16%',  rotate: -20 },
  { src: '/doodles/toast.svg',           size:  44, top: 2550,  left: '60%',  rotate:  10 },
  { src: '/doodles/egg.svg',             size:  56, top: 2780,  left: '35%',  rotate: -30 },
  { src: '/doodles/coffee-cup.svg',      size:  48, top: 2980,  left: '78%',  rotate:  26 },
  { src: '/doodles/pizza-slice.svg',     size:  52, top: 3060,  left: '22%',  rotate: -18 },
  { src: '/doodles/soup.svg',            size:  58, top: 3240,  left: '50%',  rotate:  36 },
  { src: '/doodles/burger.svg',          size:  46, top: 3480,  left: '8%',   rotate: -22 },
  { src: '/doodles/square-sandwich.svg', size:  60, top: 3580,  left: '88%',  rotate:  14 },
]

export default function DoodleBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
      }}
    >
      {placements.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            opacity: 'var(--doodle-opacity)',
            filter: 'var(--doodle-filter)',
            transform: `rotate(${d.rotate}deg)`,
            transition: 'opacity 0.3s ease, filter 0.3s ease',
          }}
        >
          <Image
            src={d.src}
            alt=""
            width={d.size}
            height={d.size}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            priority={i < 6}
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}
