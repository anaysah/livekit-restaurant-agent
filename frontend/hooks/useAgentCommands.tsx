// hooks/useAgentCommands.tsx

"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAgentBridge } from "./useAgentBridge";
import { MessageTopic, UICommandMessage, NavigationMessage } from "@/types/agent-bridge";
import actionRegistry from "@/lib/actions/action-registry";

/**
 * Hook to handle agent commands
 * Use this at the root level or in layout to enable agent control over UI
 */
export function useAgentCommands() {
  const { onMessage } = useAgentBridge();
  const router = useRouter();

  /**
   * Handle UI commands from agent
   */
  const handleUICommand = useCallback(
    (message: UICommandMessage) => {
      const { command, target, data } = message.payload;

      switch (command) {
        case "navigate":
          if (data?.route) {
            router.push(data.route);
          }
          break;

        case "scroll":
          if (target) {
            const element = document.querySelector(target);
            element?.scrollIntoView({ behavior: "smooth" });
          }
          break;

        case "focus":
          if (target) {
            const element = document.querySelector(target) as HTMLElement;
            element?.focus();
          }
          break;

        case "submit":
          if (target) {
            const form = document.querySelector(target) as HTMLFormElement;
            form?.requestSubmit();
          }
          break;

        case "show":
        case "hide":
          if (target) {
            const element = document.querySelector(target) as HTMLElement;
            if (element) {
              element.style.display = command === "show" ? "" : "none";
            }
          }
          break;

        default:
          // Try to execute from action registry
          if (actionRegistry.has(command)) {
            actionRegistry.execute(command, data);
          } else {
            console.warn(`[AgentCommands] Unknown command: ${command}`);
          }
      }
    },
    [router]
  );

  /**
   * Handle navigation commands from agent
   */
  const handleNavigation = useCallback(
    (message: NavigationMessage) => {
      console.log("[AgentCommands] 🧭 Navigation message received:", message);
      const { route, to } = message.payload;
      console.log("[AgentCommands] 🧭 Route:", route, "Context:", to);
      
      if (route) {
        console.log("[AgentCommands] 🚀 Navigating to:", route);
        router.push(route);
      } else {
        console.warn("[AgentCommands] ⚠️ No route in navigation message");
      }
    },
    [router]
  );

  // Register handlers
  useEffect(() => {
    const unsubUICommand = onMessage(MessageTopic.UI_COMMAND, handleUICommand);
    const unsubNavigation = onMessage(MessageTopic.NAVIGATION, handleNavigation);

    return () => {
      unsubUICommand();
      unsubNavigation();
    };
  }, [onMessage, handleUICommand, handleNavigation]);
}
