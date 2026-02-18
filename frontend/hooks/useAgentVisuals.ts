// hooks/useAgentVisuals.ts
"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store/app-store";
import { elementRegistry } from "@/lib/element-registry";
import { AGENT_ACTIONS, PAGES } from "@/lib/constants";
import { useRouter } from "next/navigation"; // Import Router

export function useAgentVisuals() {
  const router = useRouter(); // Initialize Router
  const signal = useAppStore((s) => s.signal);
  const setPage = useAppStore((s) => s.setPage); // Import setPage
  const updateForm = useAppStore((s) => s.updateForm); // Import updateForm

  useEffect(() => {
    if (!signal || !signal.type) return;

    // 1. Form Prefill
    if (signal.type === AGENT_ACTIONS.FORM_PREFILL) {
      const { formId, values } = signal.payload;
      elementRegistry.scrollTo(formId);
      Object.keys(values).forEach((field, index) => {
        setTimeout(() => {
          elementRegistry.highlight(`${formId}-${field}`);
          // Optional: Add value to the form field (if you want to visually show prefill)
          updateForm(formId, { [field]: values[field] });
        }, index * 300);
      });
    }

    // 2. Navigate Page
    if (signal.type === AGENT_ACTIONS.NAVIGATE_PAGE) {
      const pageId = signal.payload.page;
      const targetPage = Object.values(PAGES).find(p => p.id === pageId);

      if (targetPage) {
        // Directly Router ko bolo aage badhne ko
        // Store automatically useNavigationSync se update hoga (single source of truth)
        router.push(targetPage.path);
      }
    }
    
    // 3. UI Actions
    if (signal.type === AGENT_ACTIONS.UI_ACTIONS) {
       const { action, target } = signal.payload;
       if (action === "SCROLL_TO") elementRegistry.scrollTo(target);
       if (action === "HIGHLIGHT") elementRegistry.highlight(target);
    }
    
  }, [signal, setPage, updateForm, router]);
}