// components/website/booking-form.tsx

"use client";

import { useCallback, useEffect } from "react";
import { useAppStore, selectFormData } from "@/lib/store/app-store";
import { useRegisterElement } from "@/hooks/useRegisterElement";
import { FORMS, UI_TO_AGENT_EVENTS } from "@/lib/constants";

type SelectedTable = { id: number; seats: number } | null

export default function BookingForm({ selectedTable }: { selectedTable?: SelectedTable }) {
  // 1. Register Container for Scrolling
  const containerRef = useRegisterElement(FORMS.BOOKING.id);

  // 2. Connect to Store
  const formData = useAppStore(selectFormData(FORMS.BOOKING.id));
  const updateForm = useAppStore((s) => s.updateForm);
  const dispatchOutboundSignal = useAppStore((s) => s.dispatchOutboundSignal);

  // Sync selectedTable prop → form store whenever it changes
  useEffect(() => {
    updateForm(FORMS.BOOKING.id, {
      table_id: selectedTable?.id ?? null,
      table_seats: selectedTable?.seats ?? null,
    });
  }, [selectedTable, updateForm]);

  // 3. Outbound Handlers
  // onBlur: User left a field -> send current form snapshot to agent
  const handleBlur = useCallback(() => {
    dispatchOutboundSignal(UI_TO_AGENT_EVENTS.FORM_UPDATE, {
      formId: FORMS.BOOKING.id,
      values: formData,
    });
  }, [dispatchOutboundSignal, formData]);

  // onSubmit: User confirmed booking -> send full form to agent
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    dispatchOutboundSignal(UI_TO_AGENT_EVENTS.FORM_SUBMITTED, {
      formId: FORMS.BOOKING.id,
      values: formData,
    });
  }, [dispatchOutboundSignal, formData]);

  return (
    <div ref={containerRef} className="">
      <div className="">
        {/* <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Book A Table
          </h1>
          <p className="text-lg text-text-muted">
            Reserve your table for an unforgettable dining experience
          </p>
        </div> */}

        <div className="bg-card border border-border rounded-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Selected Table field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selected Table
              </label>
              <div
                className="w-full px-4 py-2 border rounded-sm flex items-center gap-3 min-h-[42px]"
                style={selectedTable
                  ? { background: "color-mix(in srgb, var(--color-primary) 8%, var(--color-background))", borderColor: "color-mix(in srgb, var(--color-primary) 40%, transparent)" }
                  : { background: "var(--color-background)", borderColor: "var(--color-border)" }
                }
              >
                {selectedTable ? (
                  <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                    🪑 Table {selectedTable.id} &mdash; {selectedTable.seats} seats
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Select a table from the floor plan →
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.customer_name || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { customer_name: e.target.value })}
                  onBlur={handleBlur}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.customer_phone || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { customer_phone: e.target.value })}
                  onBlur={handleBlur}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                  placeholder="+1 234 567 890"
                />
              </div>

              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-foreground mb-2">
                  Number of Guests *
                </label>
                <select
                  id="guests"
                  required
                  value={formData.no_of_guests || "2"}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { no_of_guests: e.target.value })}
                  onBlur={handleBlur}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  required
                  value={formData.reservation_date || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { reservation_date: e.target.value })}
                  onBlur={handleBlur}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  required
                  value={formData.reservation_time || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { reservation_time: e.target.value })}
                  onBlur={handleBlur}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                id="message"
                rows={4}
                value={formData.special_requests || ""}
                onChange={(e) => updateForm(FORMS.BOOKING.id, { special_requests: e.target.value })}
                onBlur={handleBlur}
                className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground resize-none"
                placeholder="Any special requirements or requests..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-sm hover:bg-secondary transition-colors font-medium text-lg"
            >
              Confirm Booking
            </button>
          </form>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-card border border-border rounded-lg">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-semibold text-foreground mb-2">Location</h3>
            <p className="text-text-muted text-sm">123 Main Street, City</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-lg">
            <div className="text-3xl mb-3">📞</div>
            <h3 className="font-semibold text-foreground mb-2">Phone</h3>
            <p className="text-text-muted text-sm">+1 (234) 567-890</p>
          </div>
          <div className="text-center p-6 bg-card border border-border rounded-lg">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="font-semibold text-foreground mb-2">Hours</h3>
            <p className="text-text-muted text-sm">Mon-Sun: 11AM - 11PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
