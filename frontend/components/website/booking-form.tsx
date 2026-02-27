// components/website/booking-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useAppStore, selectFormData } from "@/lib/store/app-store";
import { useRegisterElement } from "@/hooks/useRegisterElement";
import { FORMS, UI_TO_AGENT_EVENTS } from "@/lib/constants";
import { useFormSync } from "@/hooks/useFormSync";
import { validateBookingForm } from "@/lib/form-rules";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_INPUT = "w-full px-4 py-2 bg-background border rounded-sm focus:outline-none text-foreground transition-colors";

function inputCls(hasError: boolean) {
  return `${BASE_INPUT} ${hasError ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"}`;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

export default function BookingForm() {
  // 1. Register Container for Scrolling
  const containerRef = useRegisterElement(FORMS.BOOKING.id);

  // 2. Connect to Store
  const formData = useAppStore(selectFormData(FORMS.BOOKING.id));
  const updateForm = useAppStore((s) => s.updateForm);
  const dispatchOutboundSignal = useAppStore((s) => s.dispatchOutboundSignal);

  // 3. Auto-sync valid field changes → agent
  useFormSync(FORMS.BOOKING.id);

  // Initialize defaults that have a UI-visible preselected value
  useEffect(() => {
    if (!formData.no_of_guests) {
      updateForm(FORMS.BOOKING.id, { no_of_guests: "2" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4. Validation state
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Always-fresh errors derived from current formData
  const errors = validateBookingForm(formData);

  // Show error only if field was blurred or form was submitted
  function err(field: string): string | undefined {
    if (!submitted && !touched.has(field)) return undefined;
    return errors[field];
  }

  function touch(field: string) {
    setTouched((prev) => new Set([...prev, field]));
  }

  // 5. Submit
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return; // show all errors, stop here
    dispatchOutboundSignal(UI_TO_AGENT_EVENTS.FORM_SUBMITTED, {
      formId: FORMS.BOOKING.id,
      values: formData,
    });
  }

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
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Selected Table field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selected Table
              </label>
              <div
                className={`w-full px-4 py-2 border rounded-sm flex items-center gap-3 min-h-10.5 transition-colors ${err("table_id") ? "border-red-500" : "border-border"}`}
                style={formData.table_id
                  ? { background: "color-mix(in srgb, var(--color-primary) 8%, var(--color-background))", borderColor: err("table_id") ? undefined : "color-mix(in srgb, var(--color-primary) 40%, transparent)" }
                  : { background: "var(--color-background)" }
                }
              >
                {formData.table_id ? (
                  <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
                    🪑 Table {formData.table_id} &mdash; {formData.table_seats} seats
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Select a table from the floor plan →
                  </span>
                )}
              </div>
              <FieldError msg={err("table_id")} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.customer_name || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { customer_name: e.target.value })}
                  onBlur={() => touch("customer_name")}
                  className={inputCls(!!err("customer_name"))}
                  placeholder="John Doe"
                />
                <FieldError msg={err("customer_name")} />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.customer_phone || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { customer_phone: e.target.value })}
                  onBlur={() => touch("customer_phone")}
                  className={inputCls(!!err("customer_phone"))}
                  placeholder="+1 234 567 890"
                />
                <FieldError msg={err("customer_phone")} />
              </div>

              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-foreground mb-2">
                  Number of Guests *
                </label>
                <select
                  id="guests"
                  value={formData.no_of_guests ?? "2"}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { no_of_guests: e.target.value })}
                  onBlur={() => touch("no_of_guests")}
                  className={inputCls(!!err("no_of_guests"))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
                <FieldError msg={err("no_of_guests")} />
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.reservation_date || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { reservation_date: e.target.value })}
                  onBlur={() => touch("reservation_date")}
                  className={inputCls(!!err("reservation_date"))}
                />
                <FieldError msg={err("reservation_date")} />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-foreground mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  value={formData.reservation_time || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { reservation_time: e.target.value })}
                  onBlur={() => touch("reservation_time")}
                  className={inputCls(!!err("reservation_time"))}
                />
                <FieldError msg={err("reservation_time")} />
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
                onBlur={() => touch("special_requests")}
                className={`${inputCls(!!err("special_requests"))} resize-none`}
                placeholder="Any special requirements or requests..."
              />
              <FieldError msg={err("special_requests")} />
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
