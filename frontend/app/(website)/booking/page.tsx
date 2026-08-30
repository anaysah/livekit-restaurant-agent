"use client";

// booking/page.tsx

import React from "react";
import BookingForm from "@/components/website/booking-form";
import { RestaurantLayout } from "@/components/website/booking/RestaurantLayout";
import { useAppStore, selectFormData } from "@/lib/store/app-store";
import { FORMS } from "@/lib/constants";

export default function BookingPage() {
  const updateForm = useAppStore((s) => s.updateForm);
  const formData = useAppStore(selectFormData(FORMS.BOOKING.id));

  const selectedTableId = formData.table_id
    ? String(formData.table_id).startsWith("T")
      ? String(formData.table_id)
      : `T${formData.table_id}`
    : null;

  return (
    <div className="min-h-screen px-[5%] py-[100px]">
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
          Choose your table from the floor plan, then fill in your details. We&apos;ll confirm within minutes.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div
        className="grid items-start gap-10"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Left — Booking Form */}
        <div>
          <BookingForm />
        </div>

        {/* Right — Interactive Floor Plan (Sticky) */}
        <div className="sticky top-24">
          <RestaurantLayout
            selectedTableId={selectedTableId}
            onTableSelect={(table) => {
              const tableNumber = parseInt(table.id.replace(/\D/g, ""), 10);
              updateForm(FORMS.BOOKING.id, {
                table_id: isNaN(tableNumber) ? table.id : tableNumber,
                table_seats: table.capacity,
              });
            }}
          />
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
