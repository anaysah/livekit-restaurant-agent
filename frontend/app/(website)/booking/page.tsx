"use client"

// booking/page.tsx

import React, { useState } from 'react'
import BookingForm from '@/components/website/booking-form'
import SeatingPlan from '@/components/website/booking/seating-plan'

export default function BookingPage() {
  const [selectedTable, setSelectedTable] = useState<{ id: number; seats: number } | null>(null)

  return (
    <div
      className="min-h-screen px-[5%] py-[100px]"
      style={{ background: "var(--color-background)" }}
    >
      {/* ── Page Header ── */}
      <div className="mb-14">
        <p
          className="text-[11px] font-semibold tracking-[4px] uppercase mb-3"
          style={{ color: "var(--color-primary)" }}
        >
          Reserve Your Evening
        </p>
        <h1
          className="font-bold"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(36px, 4.5vw, 58px)",
            lineHeight: 1.1,
            letterSpacing: "-0.5px",
            color: "var(--color-foreground)",
          }}
        >
          Book a{" "}
          <em style={{ fontStyle: "italic", color: "var(--color-primary)" }}>Table</em>
        </h1>
        <p
          className="text-[15px] leading-[1.75] font-light mt-3"
          style={{ color: "var(--color-text-secondary)", maxWidth: "480px" }}
        >
          Choose your table from the floor plan, then fill in your details. We'll confirm within minutes.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div
        className="grid items-start gap-10"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Left — Booking Form */}
        <div>
          {/* Selected table pill */}
          {/* {selectedTable && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm font-medium"
              style={{
                background: "color-mix(in srgb, var(--color-primary) 10%, var(--color-background))",
                border: "1.5px solid color-mix(in srgb, var(--color-primary) 40%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              <span className="text-base">🪑</span>
              Table {selectedTable.id} selected — {selectedTable.seats} seats
              <button
                onClick={() => setSelectedTable(null)}
                className="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
                style={{ color: "var(--color-primary)" }}
              >
                Clear ×
              </button>
            </div>
          )} */}
          <BookingForm selectedTable={selectedTable} />
        </div>

        {/* Right — Seating Plan (sticky) */}
        <div className="" style={{ 
          height: "calc(100vh - 70px - 40px)" ,
          background: "var(--color-background)",
          }}>
          <SeatingPlan
            onSelect={(table: { id: number; seats: number } | null) => setSelectedTable(table)}
          />
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

