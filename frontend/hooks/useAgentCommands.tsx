// hooks/useAgentCommands.tsx

"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAgentBridge } from "./useAgentBridge";
import { useAppStore } from "@/lib/store/app-store";
import { 
  MessageTopic, 
  UIActionMessage, 
  NavigationMessage, 
  FormPrefillMessage 
} from "@/types/agent-bridge";

/**
 * Hook to handle all agent actions in one place
 * Use this at the root level or in layout to enable agent control over UI
 */
export function useAgentCommands() {
  const { registerHandler } = useAgentBridge();
  const router = useRouter();
  const { setContext, clearFormState, setFormState } = useAppStore();

  /**
   * Handle UI actions from agent (DOM operations)
   */
  const handleUIAction = useCallback(
    (message: UIActionMessage) => {
      try {
        const { action, target, data } = message.payload;

        switch (action) {
          case "scroll":
            if (target) {
              const element = document.querySelector(target);
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                console.log(`[AgentCommands] ✓ Scrolled to: ${target}`);
              } else {
                console.warn(`[AgentCommands] Element not found: ${target}`);
              }
            }
            break;

          case "focus":
            if (target) {
              const element = document.querySelector(target) as HTMLElement;
              if (element) {
                element.focus();
                console.log(`[AgentCommands] ✓ Focused: ${target}`);
              } else {
                console.warn(`[AgentCommands] Element not found: ${target}`);
              }
            }
            break;

          case "submit":
            if (target) {
              const form = document.querySelector(target) as HTMLFormElement;
              if (form) {
                form.requestSubmit();
                console.log(`[AgentCommands] ✓ Submitted form: ${target}`);
              } else {
                console.warn(`[AgentCommands] Form not found: ${target}`);
              }
            }
            break;

          case "show":
          case "hide":
            if (target) {
              const element = document.querySelector(target) as HTMLElement;
              if (element) {
                element.style.display = action === "show" ? "" : "none";
                console.log(`[AgentCommands] ✓ ${action}: ${target}`);
              } else {
                console.warn(`[AgentCommands] Element not found: ${target}`);
              }
            }
            break;

          case "clear-form":
            if (data?.formId) {
              clearFormState(data.formId);
              console.log(`[AgentCommands] ✓ Cleared form: ${data.formId}`);
            } else {
              console.warn("[AgentCommands] No formId provided for clear-form action");
            }
            break;

          default:
            console.warn(`[AgentCommands] Unknown action: ${action}`);
        }
      } catch (error) {
        console.error("[AgentCommands] Error handling UI action:", error);
      }
    },
    [clearFormState]
  );

  /**
   * Handle navigation commands from agent
   */
  const handleNavigation = useCallback(
    (message: NavigationMessage) => {
      try {
        const { route, to } = message.payload;
        
        // Update context in store
        if (to) {
          setContext(to, message.payload.metadata);
          console.log(`[AgentCommands] ✓ Context updated to: ${to}`);
        }
        
        // Navigate to route
        if (route) {
          router.push(route);
          console.log(`[AgentCommands] ✓ Navigated to: ${route}`);
        } else {
          console.warn("[AgentCommands] No route in navigation message");
        }
      } catch (error) {
        console.error("[AgentCommands] Error handling navigation:", error);
      }
    },
    [router, setContext]
  );

  /**
   * Handle form prefill commands from agent
   */
  const handleFormPrefill = useCallback(
    (message: FormPrefillMessage) => {
      try {
        const { formId, values, merge } = message.payload;
        setFormState(formId, values, merge);
        console.log(`[AgentCommands] ✓ Prefilled form: ${formId}`, values);
      } catch (error) {
        console.error("[AgentCommands] Error handling form prefill:", error);
      }
    },
    [setFormState]
  );

  // Register handlers
  useEffect(() => {
    const unsubUIAction = registerHandler(MessageTopic.UI_ACTION, handleUIAction);
    const unsubNavigation = registerHandler(MessageTopic.NAVIGATION, handleNavigation);
    const unsubFormPrefill = registerHandler(MessageTopic.FORM_PREFILL, handleFormPrefill);

    return () => {
      unsubUIAction();
      unsubNavigation();
      unsubFormPrefill();
    };
  }, [registerHandler, handleUIAction, handleNavigation, handleFormPrefill]);
}
