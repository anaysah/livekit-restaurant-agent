// components/AgentBridgeProvider.tsx

"use client";

import { useEffect } from "react";
import { useContextSync } from "@/hooks/useContextSync";
import { useAgentCommands } from "@/hooks/useAgentCommands";
import actionRegistry from "@/lib/actions/action-registry";
import { useAppStore } from "@/lib/store/app-store";
import { useRouter } from "next/navigation";

/**
 * Provider component that enables all agent bridge functionality
 * Wrap your app with this component to enable bidirectional communication
 */
export function AgentBridgeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setContext = useAppStore((state) => state.setContext);

  // Enable context sync
  useContextSync();

  // Enable agent commands
  useAgentCommands();

  // Register common actions
  useEffect(() => {
    actionRegistry.registerMany([
      {
        id: "navigate-home",
        name: "Navigate to Home",
        handler: () => {
          router.push("/");
          setContext("home");
        },
      },
      {
        id: "navigate-booking",
        name: "Navigate to Booking",
        context: ["home", "ordering", "support"],
        handler: () => {
          // You can navigate to your booking route
          // router.push("/booking");
          setContext("booking");
        },
      },
      {
        id: "navigate-ordering",
        name: "Navigate to Ordering",
        context: ["home", "booking", "support"],
        handler: () => {
          // router.push("/order");
          setContext("ordering");
        },
      },
      {
        id: "clear-form",
        name: "Clear Form",
        handler: (params: { formId: string }) => {
          if (params?.formId) {
            useAppStore.getState().clearFormState(params.formId);
            console.log(`Cleared form: ${params.formId}`);
          }
        },
      },
    ]);

    return () => {
      // Optional: Clean up actions on unmount
      // actionRegistry.clear();
    };
  }, [router, setContext]);

  return <>{children}</>;
}
