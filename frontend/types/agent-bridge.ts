// types/agent-bridge.ts
import { AGENT_ACTIONS, AGENT_UI_ACTIONS } from "@/lib/constants";
import { AppContext } from "next/dist/pages/_app";

export type PAGE = "home" | "booking" | "ordering" | "profile" | string;

// The shape of our global app state
export interface AppState {
  currentPage: PAGE;
  forms: Record<string, Record<string, any>>;
  meta: Record<string, any>;
}

// Messages sent FROM Agent TO UI
export type AgentToUIMessage = 
  | {type: typeof AGENT_ACTIONS.NAVIGATE_PAGE; payload: { page: PAGE }} // Action: Change page
  | { type: typeof AGENT_ACTIONS.STATE_UPDATE; payload: Partial<AppState> } // Silent data update
  | { type: typeof AGENT_ACTIONS.FORM_PREFILL; payload: { formId: string; values: Record<string, any> } } // Action: Fill form
  | { type: typeof AGENT_ACTIONS.UI_ACTIONS; payload: { action: keyof typeof AGENT_UI_ACTIONS; target: string } } // Action: UI interaction (scroll, highlight, focus)
  

// Messages sent FROM UI TO Agent
export type UIToAgentMessage =
  | { type: "FORM_UPDATE";    payload: { formId: string; values: Record<string, any> } }
  | { type: "FORM_SUBMITTED"; payload: { formId: string; values: Record<string, any> } }
  | { type: "PAGE_CHANGED";   payload: { page: string; path: string } }
  | { type: "STATE_SYNC";     payload: AppState };