// lib/store/app-store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AppContext, AppState } from "@/types/agent-bridge";

interface AppStore extends AppState {
  // Actions
  setContext: (context: AppContext, metadata?: Record<string, any>) => void;
  updateFormState: (formId: string, field: string, value: any) => void;
  setFormState: (formId: string, values: Record<string, any>, merge?: boolean) => void;
  getFormState: (formId: string) => Record<string, any>;
  clearFormState: (formId: string) => void;
  updateAgentAwareness: (context: AppContext) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentContext: "home",
  previousContext: null,
  formStates: {},
  navigationHistory: ["home"],
  agentAwareness: {
    lastSyncedContext: null,
    lastSyncedAt: null,
  },
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Change the current context (e.g., from home to booking)
       */
      setContext: (context: AppContext, metadata?: Record<string, any>) => {
        const currentContext = get().currentContext;
        set((state) => ({
          previousContext: currentContext,
          currentContext: context,
          navigationHistory: [...state.navigationHistory, context],
        }));
      },

      /**
       * Update a single field in a form
       */
      updateFormState: (formId: string, field: string, value: any) => {
        set((state) => ({
          formStates: {
            ...state.formStates,
            [formId]: {
              ...(state.formStates[formId] || {}),
              [field]: value,
            },
          },
        }));
      },

      /**
       * Set entire form state (used by agent for prefilling)
       */
      setFormState: (formId: string, values: Record<string, any>, merge = true) => {
        set((state) => ({
          formStates: {
            ...state.formStates,
            [formId]: merge
              ? { ...(state.formStates[formId] || {}), ...values }
              : values,
          },
        }));
      },

      /**
       * Get form state by ID
       */
      getFormState: (formId: string) => {
        return get().formStates[formId] || {};
      },

      /**
       * Clear a form's state
       */
      clearFormState: (formId: string) => {
        set((state) => {
          const { [formId]: _, ...rest } = state.formStates;
          return { formStates: rest };
        });
      },

      /**
       * Update what the agent knows about the current state
       */
      updateAgentAwareness: (context: AppContext) => {
        set({
          agentAwareness: {
            lastSyncedContext: context,
            lastSyncedAt: Date.now(),
          },
        });
      },

      /**
       * Reset the entire store to initial state
       */
      reset: () => set(initialState),
    }),
    { name: "AppStore" }
  )
);

/**
 * Selectors for optimized component re-renders
 */
export const selectCurrentContext = (state: AppStore) => state.currentContext;
export const selectPreviousContext = (state: AppStore) => state.previousContext;
export const selectFormState = (formId: string) => (state: AppStore) =>
  state.formStates[formId] || {};
export const selectNavigationHistory = (state: AppStore) => state.navigationHistory;
export const selectAgentAwareness = (state: AppStore) => state.agentAwareness;
