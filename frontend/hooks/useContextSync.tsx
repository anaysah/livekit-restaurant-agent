// hooks/useContextSync.tsx

"use client";

import { useEffect, useRef } from "react";
import { useAgentBridge } from "./useAgentBridge";
import { useAppStore } from "@/lib/store/app-store";
import { MessageTopic } from "@/types/agent-bridge";

/**
 * Hook to automatically sync context changes with agent
 * Use this at the root level or in layout
 */
export function useContextSync() {
  const { sendToAgent } = useAgentBridge();
  const currentContext = useAppStore((state) => state.currentContext);
  const previousContext = useAppStore((state) => state.previousContext);
  const updateAgentAwareness = useAppStore((state) => state.updateAgentAwareness);
  
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid sending initial state
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Send context change to agent
    sendToAgent({
      topic: MessageTopic.CONTEXT_CHANGE,
      payload: {
        from: previousContext,
        to: currentContext,
        metadata: {
          timestamp: Date.now(),
        },
      },
    });

    // Update agent awareness
    updateAgentAwareness(currentContext);

    console.log(`[ContextSync] Context changed: ${previousContext} → ${currentContext}`);
  }, [currentContext, previousContext, sendToAgent, updateAgentAwareness]);
}
