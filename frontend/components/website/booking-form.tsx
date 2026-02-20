// components/website/booking-form.tsx

"use client";

import { useAppStore } from "@/lib/store/app-store";
import { useRegisterElement } from "@/hooks/useRegisterElement";
import { FORMS } from "@/lib/constants";
import { useShallow } from "zustand/react/shallow";

export default function BookingForm() {
  // 1. Register Container for Scrolling
  const containerRef = useRegisterElement(FORMS.BOOKING.id);

  // 2. Connect to Store
  const formData = useAppStore(useShallow((s) => s.forms[FORMS.BOOKING.id] || {}));
  const updateForm = useAppStore((s) => s.updateForm);

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Book A Table
          </h1>
          <p className="text-lg text-text-muted">
            Reserve your table for an unforgettable dining experience
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { name: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { email: e.target.value })}
                  className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:border-primary text-foreground"
                  placeholder="john@example.com"
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
                  value={formData.phone || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { phone: e.target.value })}
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
                  value={formData.guests || "2"}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { guests: e.target.value })}
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
                  value={formData.date || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { date: e.target.value })}
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
                  value={formData.time || ""}
                  onChange={(e) => updateForm(FORMS.BOOKING.id, { time: e.target.value })}
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
                value={formData.message || ""}
                onChange={(e) => updateForm(FORMS.BOOKING.id, { message: e.target.value })}
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
