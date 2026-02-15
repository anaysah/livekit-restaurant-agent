// hooks/useAgentBridge.tsx

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import type { DataPacket_Kind } from "livekit-client";
import {
  AgentBridgeMessage,
  ToAgentMessage,
  ToUIMessage,
  MessageTopic,
  MessageDirection,
  MessageHandlerRegistry,
  UICommandMessage,
  FormPrefillMessage,
  NavigationMessage,
  TaskTriggerMessage,
} from "@/types/agent-bridge";
import { useAppStore } from "@/lib/store/app-store";

/**
 * Main hook for bidirectional communication with the agent
 * Handles sending messages to agent and receiving commands from agent
 */
export function useAgentBridge() {
  const room = useRoomContext();
  const handlersRef = useRef<Record<string, Array<(message: any) => void | Promise<void>>>>({});

  const { setFormState, updateAgentAwareness, setContext } = useAppStore();

  /**
   * Generate unique message ID
   */
  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Send a message to the agent
   */
  const sendToAgent = useCallback(
    async (message: Omit<ToAgentMessage, "id" | "timestamp" | "direction">) => {
      if (!room) {
        console.warn("[AgentBridge] Room not available, cannot send message");
        return null;
      }

      const fullMessage: ToAgentMessage = {
        ...message,
        id: generateMessageId(),
        timestamp: Date.now(),
        direction: MessageDirection.TO_AGENT,
      } as ToAgentMessage;

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(fullMessage));
      
      await room.localParticipant.publishData(data, {
        topic: "agent-bridge",
        reliable: true,
      });

      console.log("[AgentBridge] 📤 Sent to agent:", fullMessage);
      return fullMessage;
    },
    [room, generateMessageId]
  );

  /**
   * Register a handler for messages from agent
   */
  const onMessage = useCallback(
    <T extends ToUIMessage>(
      topic: MessageTopic,
      handler: (message: T) => void | Promise<void>
    ) => {
      if (!handlersRef.current[topic]) {
        handlersRef.current[topic] = [];
      }
      handlersRef.current[topic]!.push(handler as any);

      // Return cleanup function
      return () => {
        const handlers = handlersRef.current[topic];
        if (handlers) {
          const index = handlers.indexOf(handler as any);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      };
    },
    []
  );

  /**
   * Process incoming messages from agent
   */
  useEffect(() => {
    if (!room) return;

    console.log("[AgentBridge] 🔌 Setting up data listener for topic: agent-bridge");

    const handleDataReceived = (
      payload: Uint8Array,
      participant: any,
      kind: DataPacket_Kind,
      topic?: string
    ) => {
      console.log("[AgentBridge] 📥 Data received from:", participant?.identity, "Topic:", topic);
      
      // Only process messages from agent-bridge topic
      if (topic !== "agent-bridge") {
        console.log("[AgentBridge] ⏭️ Skipping non-agent-bridge topic:", topic);
        return;
      }

      try {
        const decoder = new TextDecoder();
        const messageStr = decoder.decode(payload);
        const parsedMessage: AgentBridgeMessage = JSON.parse(messageStr);

        console.log("[AgentBridge] 🔵 RAW MESSAGE RECEIVED:", messageStr);
        console.log("[AgentBridge] 📦 PARSED MESSAGE:", parsedMessage);

        // Only process messages directed to UI
        if (parsedMessage.direction !== MessageDirection.TO_UI) {
          console.log("[AgentBridge] ⚠️ Message not for UI, skipping");
          return;
        }

        const toUIMessage = parsedMessage as ToUIMessage;
        console.log("[AgentBridge] ✅ Processing UI message:", toUIMessage.topic);

        // Call registered handlers for this topic
        const handlers = handlersRef.current[toUIMessage.topic];
        if (handlers && handlers.length > 0) {
          handlers.forEach((handler) => {
            try {
              handler(toUIMessage);
            } catch (error) {
              console.error("[AgentBridge] Handler error:", error);
            }
          });
        }

        // Built-in handlers for common operations
        switch (toUIMessage.topic) {
          case MessageTopic.FORM_PREFILL: {
            const msg = toUIMessage as FormPrefillMessage;
            setFormState(msg.payload.formId, msg.payload.values, msg.payload.merge);
            console.log(`[AgentBridge] Auto-prefilled form: ${msg.payload.formId}`);
            break;
          }

          case MessageTopic.NAVIGATION: {
            const msg = toUIMessage as NavigationMessage;
            setContext(msg.payload.to, msg.payload.metadata);
            console.log(`[AgentBridge] Auto-navigated to: ${msg.payload.to}`);
            break;
          }

          case MessageTopic.UI_COMMAND: {
            const msg = toUIMessage as UICommandMessage;
            console.log(`[AgentBridge] UI Command: ${msg.payload.command}`, msg.payload);
            // Handlers can be registered for specific commands
            break;
          }

          case MessageTopic.TASK_TRIGGER: {
            const msg = toUIMessage as TaskTriggerMessage;
            console.log(`[AgentBridge] Task triggered: ${msg.payload.taskId}`, msg.payload);
            break;
          }
        }
      } catch (error) {
        console.error("[AgentBridge] Error processing message:", error);
      }
    };

    room.on("dataReceived", handleDataReceived);

    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room, setFormState, setContext]);

  return {
    sendToAgent,
    onMessage,
    isConnected: !!room,
  };
}
