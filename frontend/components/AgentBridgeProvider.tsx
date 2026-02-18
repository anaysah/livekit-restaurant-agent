// components/AgentBridgeProvider.tsx
"use client";
import { useAgentBridge } from "@/hooks/useAgentBridge";
import { useNavigationSync } from "@/hooks/useNavigationSync";
import { useAgentVisuals } from "@/hooks/useAgentVisuals";

export function AgentBridgeProvider({ children }: { children: React.ReactNode }) {
  useAgentBridge();
  // useNavigationSync();
  useAgentVisuals();

  return <>{children}</>;
}