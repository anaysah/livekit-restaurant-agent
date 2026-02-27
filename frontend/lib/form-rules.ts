// lib/form-rules.ts
// Single source of truth for booking form validation rules.
// Used by:
//   - useFormSync  → per-field live validation before sending to agent
//   - booking-form → full form validation before submit

// ─── Types ───────────────────────────────────────────────────────────────────

export type FieldRule = {
  debounce: number;                        // ms delay before sending to agent
  validate?: (value: unknown) => boolean;  // must return true to send
};

// ─── Shared Rules ────────────────────────────────────────────────────────────

export const BOOKING_FIELD_RULES: Record<string, FieldRule> = {
  customer_name: {
    debounce: 800,
    validate: (v) => typeof v === "string" && v.trim().length >= 2,
  },
  customer_phone: {
    debounce: 800,
    validate: (v) => {
      const digits = String(v ?? "").replace(/\D/g, "");
      return digits.length >= 10;
    },
  },
  no_of_guests: {
    debounce: 0,
    validate: (v) => {
      const n = Number(v);
      return !isNaN(n) && n >= 1 && n <= 20;
    },
  },
  reservation_date: {
    debounce: 0,
    validate: (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v),
  },
  reservation_time: {
    debounce: 0,
    validate: (v) => typeof v === "string" && /^\d{2}:\d{2}$/.test(v),
  },
  special_requests: {
    debounce: 1200,
    // Optional: empty is fine; if filled, min 3 chars
    validate: (v) => !v || (typeof v === "string" && v.trim().length >= 3),
  },
};

// table_id + table_seats are always sent together — not in FIELD_RULES
export const TABLE_FIELDS = new Set(["table_id", "table_seats"]);

// ─── Submit Validation ───────────────────────────────────────────────────────

export type BookingErrors = Partial<Record<string, string>>;

export function validateBookingForm(data: Record<string, unknown>): BookingErrors {
  const errors: BookingErrors = {};

  // table_id — set by SeatingPlan, never typed
  if (!data.table_id)
    errors.table_id = "Please select a table from the floor plan";

  // customer_name
  if (!data.customer_name || typeof data.customer_name !== "string" || data.customer_name.trim().length < 2)
    errors.customer_name = "Full name must be at least 2 characters";

  // customer_phone
  const digits = String(data.customer_phone ?? "").replace(/\D/g, "");
  if (digits.length < 10)
    errors.customer_phone = "Enter a valid phone number (min 10 digits)";

  // no_of_guests
  const n = Number(data.no_of_guests);
  if (isNaN(n) || n < 1 || n > 20)
    errors.no_of_guests = "Select a valid number of guests";

  // reservation_date — format check + not in the past
  if (!data.reservation_date || !/^\d{4}-\d{2}-\d{2}$/.test(String(data.reservation_date))) {
    errors.reservation_date = "Select a valid date";
  } else {
    const today = new Date().toISOString().split("T")[0];
    if (String(data.reservation_date) < today)
      errors.reservation_date = "Date cannot be in the past";
  }

  // reservation_time
  if (!data.reservation_time || !/^\d{2}:\d{2}$/.test(String(data.reservation_time)))
    errors.reservation_time = "Select a time";

  // special_requests — optional, but if filled then min 3 chars
  if (
    data.special_requests &&
    typeof data.special_requests === "string" &&
    data.special_requests.trim().length > 0 &&
    data.special_requests.trim().length < 3
  )
    errors.special_requests = "Must be at least 3 characters if provided";

  return errors;
}
