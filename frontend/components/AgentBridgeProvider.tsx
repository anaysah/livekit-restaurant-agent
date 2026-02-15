// components/AgentBridgeProvider.tsx

"use client";

import { useContextSync } from "@/hooks/useContextSync";
import { useAgentCommands } from "@/hooks/useAgentCommands";

/**
 * Provider component that enables all agent bridge functionality
 * Wrap your app with this component to enable bidirectional communication
 */
export function AgentBridgeProvider({ children }: { children: React.ReactNode }) {
  // Enable context sync (UI → Agent)
  useContextSync();

  // Enable agent commands (Agent → UI)
  useAgentCommands();

  return <>{children}</>;
}
