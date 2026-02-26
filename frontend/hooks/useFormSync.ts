// hooks/useFormSync.ts
// Watches a form in the Zustand store and sends per-field FORM_UPDATE
// signals to the agent whenever a valid field value changes.
// Uses useShallow to avoid infinite re-render from object selector.
// Tracks agent-prefilled values (FORM_PREFILL) to prevent echo loop.

"use client";

import { useEffect, useRef } from "react";
import { useAppStore, selectFormData } from "@/lib/store/app-store";
import { useShallow } from "zustand/react/shallow";
import { UI_TO_AGENT_EVENTS } from "@/lib/constants";

// ─── Per-field rules ────────────────────────────────────────────────────────

type FieldRule = {
  debounce: number;                        // ms delay before sending
  validate?: (value: unknown) => boolean;  // must return true to send
};

const FIELD_RULES: Record<string, FieldRule> = {
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
    // Optional field — empty / null / undefined is fine; if filled, min 3 chars
    validate: (v) => !v || (typeof v === "string" && v.trim().length >= 3),
  },
};

// table_id + table_seats are always sent together in one message
const TABLE_FIELDS = new Set(["table_id", "table_seats"]);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFormSync(formId: string) {
  // useShallow prevents infinite loop from object selector returning new reference each render
  const formData = useAppStore(useShallow(selectFormData(formId)));
  const dispatchOutboundSignal = useAppStore((s) => s.dispatchOutboundSignal);
  const inboundSignal = useAppStore((s) => s.signal);

  const prevRef    = useRef<Record<string, unknown>>({});
  const timersRef  = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Values last set by the agent — do NOT echo these back as FORM_UPDATE
  const agentPrefillRef = useRef<Record<string, unknown>>({});

  // When agent sends FORM_PREFILL for this form, record those values so
  // the formData effect below can skip them (prevent echo loop)
  useEffect(() => {
    if (!inboundSignal) return;
    if (inboundSignal.type !== "FORM_PREFILL") return;
    if (inboundSignal.payload?.formId !== formId) return;

    const values: Record<string, unknown> = inboundSignal.payload?.values ?? {};
    agentPrefillRef.current = { ...agentPrefillRef.current, ...values };
  }, [inboundSignal, formId]);

  useEffect(() => {
    const prev    = prevRef.current;
    const changed: string[] = [];

    for (const key of Object.keys(formData)) {
      if (formData[key] !== prev[key]) changed.push(key);
    }

    if (changed.length === 0) return;

    // Snapshot prev before any async work
    prevRef.current = { ...formData };

    // ── table_id / table_seats → send together ──────────────────────────────
    const tableChanged = changed.some((k) => TABLE_FIELDS.has(k));
    if (tableChanged) {
      clearTimeout(timersRef.current["__table"]);
      const tableId    = formData["table_id"];
      const tableSeats = formData["table_seats"];

      // Skip if both values were agent-prefilled (echo prevention)
      const agentFilledTable =
        agentPrefillRef.current["table_id"] === tableId &&
        agentPrefillRef.current["table_seats"] === tableSeats;
      if (agentFilledTable) {
        delete agentPrefillRef.current["table_id"];
        delete agentPrefillRef.current["table_seats"];
      } else if (tableId !== null && tableId !== undefined) {
        timersRef.current["__table"] = setTimeout(() => {
          dispatchOutboundSignal(UI_TO_AGENT_EVENTS.FORM_UPDATE, {
            formId,
            values: { table_id: tableId, table_seats: tableSeats },
          });
        }, 0);
      }
    }

    // ── Regular fields ───────────────────────────────────────────────────────
    for (const field of changed) {
      if (TABLE_FIELDS.has(field)) continue;       // already handled above
      const rule = FIELD_RULES[field];
      if (!rule) continue;                          // unknown field — skip
      const value = formData[field];
      if (rule.validate && !rule.validate(value)) continue; // invalid — skip

      // Echo prevention: skip if this value was just set by the agent via FORM_PREFILL
      if (field in agentPrefillRef.current && agentPrefillRef.current[field] === value) {
        delete agentPrefillRef.current[field];
        continue;
      }

      clearTimeout(timersRef.current[field]);
      const captured = value; // capture for closure
      timersRef.current[field] = setTimeout(() => {
        dispatchOutboundSignal(UI_TO_AGENT_EVENTS.FORM_UPDATE, {
          formId,
          values: { [field]: captured },
        });
      }, rule.debounce);
    }
  }, [formData, formId, dispatchOutboundSignal]);
}
