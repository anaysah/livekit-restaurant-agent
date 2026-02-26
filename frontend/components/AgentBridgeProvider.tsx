// components/AgentBridgeProvider.tsx
"use client";
import { useAgentBridge } from "@/hooks/useAgentBridge";
import { useNavigationSync } from "@/hooks/useNavigationSync";
import { useAgentVisuals } from "@/hooks/useAgentVisuals";
import { useAgentSessionInit } from "@/hooks/useAgentSessionInit";

export function AgentBridgeProvider({ children }: { children: React.ReactNode }) {
  useAgentBridge();
  useNavigationSync();
  useAgentVisuals();
  useAgentSessionInit();

  return <>{children}</>;
}