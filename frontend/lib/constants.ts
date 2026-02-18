// lib/constants.ts

// 1. Page Names (Contexts)
export const PAGES = {
  HOME: {
    id: "home",       // Agent ke liye (logic)
    path: "/",        // Router ke liye (URL)
  },
  BOOKING: {
    id: "booking",
    path: "/booking",
  },
  ORDERING: {
    id: "order",
    path: "/order-food",
  },
  PROFILE: {
    id: "profile",
    path: "/profile",
  },
} as const;

// Optional: Helper types
export type PageId = typeof PAGES[keyof typeof PAGES]["id"];
export type PagePath = typeof PAGES[keyof typeof PAGES]["path"];

// lib/constants.ts

export const FORMS = {
  BOOKING: {
    id: "booking-form",
    pageId: PAGES.BOOKING.id, // 👈 Yeh batata hai ki form kis page pe hai
  },
  ORDER: {
    id: "order-form",
    pageId: PAGES.ORDERING.id,
  },
  CONTACT: {
    id: "contact-us-form",
    pageId: PAGES.HOME.id, // Maan lo contact form home page pe hai
  },
} as const;

// 3. Element IDs (For scrolling/highlighting) WILL USE LATER
// export const ELEMENTS = {
//   BOOKING_CONTAINER: "booking-container",
//   ORDER_BUTTON: "submit-order-btn",
//   NAVBAR: "main-navbar",
// } as const;

// 4. Agent Actions (Internal Signals)
export const AGENT_ACTIONS = {
  FORM_PREFILL: "FORM_PREFILL",
  NAVIGATE_PAGE: "NAVIGATE_PAGE",
  STATE_UPDATE: "STATE_UPDATE",
  UI_ACTIONS: "UI_ACTION",
} as const;

export const AGENT_UI_ACTIONS = {
  SCROLL_TO: "SCROLL_TO",
  HIGHLIGHT: "HIGHLIGHT",
  FOCUS: "FOCUS",
}

export const AGENT_UI_TOPIC_NAME = "agent-to-ui"; // Data channel topic for agent -> UI communication