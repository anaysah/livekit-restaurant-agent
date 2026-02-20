// lib/store/app-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware"; // 1. Import devtools
import type { AppState, PAGE } from "@/types/agent-bridge";
import { PAGES } from "@/lib/constants";
import { AGENT_ACTIONS } from "@/lib/constants";


// 1. Define Signal Types (Event replacements)
export interface AgentSignal {
  type: string;
  payload: any;
  timestamp: number;
}

// Outbound Signal: UI -> Agent
export interface OutboundSignal {
  type: string;
  payload: any;
  timestamp: number;
}

interface AppStore extends AppState {
  currentPage: PAGE;
  forms: Record<string, Record<string, any>>;
  meta: Record<string, any>;
  signal: AgentSignal | null;           // Inbound: Agent -> UI
  outboundSignal: OutboundSignal | null; // Outbound: UI -> Agent

  setPage: (page: PAGE) => void;
  updateForm: (formId: string, data: Record<string, any>) => void;
  applyAgentUpdate: (update: Partial<AppState>) => void;
  getStateSnapshot: () => AppState;
  dispatchSignal: (type: AgentSignal["type"], payload: any) => void;
  dispatchOutboundSignal: (type: string, payload: any) => void;
}

// 2. Wrap create function with devtools
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentPage: "",
      forms: {},
      meta: {},
      signal: null,
      outboundSignal: null, 

      // UI Actions
      setPage: (page) => set({ currentPage: page }, false, "setPage"), // Optional: Action name
      
      updateForm: (formId, data) => set((state) => ({
        forms: {
          ...state.forms,
          [formId]: { ...state.forms[formId], ...data }
        }
      }), false, "updateForm"), // Optional: Action name

      // Agent Action (Bulk update)
      applyAgentUpdate: (update) => set((state) => ({
        ...state,
        ...update,
        forms: { ...state.forms, ...update.forms } 
      }), false, "applyAgentUpdate"),

      dispatchSignal: (type, payload) => set({ 
        signal: { type, payload, timestamp: Date.now() } 
      }, false, "dispatchSignal"),

      dispatchOutboundSignal: (type, payload) => set({
        outboundSignal: { type, payload, timestamp: Date.now() }
      }, false, "dispatchOutboundSignal"),

      getStateSnapshot: () => get(),
    }),
    { name: "AppStore" } // 3. Isse Redux DevTools mein yeh naam dikhega
  )
);

// Selectors
const EMPTY_FORM_DATA: Record<string, any> = {};
export const selectFormData = (formId: string) => (state: AppStore) => state.forms[formId] ?? EMPTY_FORM_DATA;