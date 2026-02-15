// components/website/booking-form.tsx

"use client";

import { useEffect } from "react";
import { useFormSync } from "@/hooks/useFormSync";
import { useAppStore } from "@/lib/store/app-store";

const FORM_ID = "booking-form";

export default function BookingForm() {
  const { formState, updateField, sendAction } = useFormSync(FORM_ID);
  const setContext = useAppStore((state) => state.setContext);

  // Set context when component mounts
  useEffect(() => {
    setContext("booking");
    
    // Cleanup: you could reset context or not depending on your needs
    return () => {
      // Optional: setContext("home");
    };
  }, [setContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Send action to agent
    sendAction("submit-booking", {
      formData: formState,
      timestamp: Date.now(),
    });

    console.log("Booking submitted:", formState);
    alert("Booking request sent! Check console for details.");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Make a Reservation</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={formState.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formState.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={formState.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123-456-7890"
          />
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={formState.date || ""}
            onChange={(e) => updateField("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Time */}
        <div>
          <label htmlFor="time" className="block text-sm font-medium mb-1">
            Time
          </label>
          <input
            id="time"
            type="time"
            value={formState.time || ""}
            onChange={(e) => updateField("time", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Guests */}
        <div>
          <label htmlFor="guests" className="block text-sm font-medium mb-1">
            Number of Guests
          </label>
          <select
            id="guests"
            value={formState.guests || "2"}
            onChange={(e) => updateField("guests", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">1 Guest</option>
            <option value="2">2 Guests</option>
            <option value="3">3 Guests</option>
            <option value="4">4 Guests</option>
            <option value="5">5 Guests</option>
            <option value="6">6+ Guests</option>
          </select>
        </div>

        {/* Special Requests */}
        <div>
          <label htmlFor="requests" className="block text-sm font-medium mb-1">
            Special Requests
          </label>
          <textarea
            id="requests"
            value={formState.requests || ""}
            onChange={(e) => updateField("requests", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any dietary restrictions or special requests?"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Make Reservation
        </button>
      </form>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <p className="text-sm font-semibold mb-2">Form State (Debug):</p>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(formState, null, 2)}
        </pre>
      </div>
    </div>
  );
}
