// hooks/useAgentBridge.ts
"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { useAppStore } from "@/lib/store/app-store";
import type { AgentToUIMessage, UIToAgentMessage } from "@/types/agent-bridge";
import { DataPacket_Kind, Encryption_Type, RemoteParticipant } from "livekit-client";
import { AGENT_UI_TOPIC_NAME } from "@/lib/constants";

export function useAgentBridge() {
  const room = useRoomContext();
  const applyAgentUpdate = useAppStore((s) => s.applyAgentUpdate);
  const updateForm = useAppStore((s) => s.updateForm);
  const dispatchSignal = useAppStore((s) => s.dispatchSignal); // Get the dispatcher
  const getSnapshot = useAppStore((s) => s.getStateSnapshot);

  // 1. OUTGOING: Sync Store -> Agent
  useEffect(() => {
    if (!room) return;
    
    const unsubscribe = useAppStore.subscribe(() => {
      const currentState = getSnapshot();
      const msg: UIToAgentMessage = {
        type: "STATE_SYNC",
        payload: currentState
      };
      
      room.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(msg)),
        { reliable: true }
      );
    });
    
    return unsubscribe;
  }, [room, getSnapshot]);

  // 2. INCOMING: Agent -> Store/Action
   // INCOMING: Agent -> Store/Action
  useEffect(() => {
    if (!room) return;

    const handleData = ( 
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string,
      encryptionType?: Encryption_Type
    ) => {
      if (topic !== AGENT_UI_TOPIC_NAME) return; // Filter for our specific channel
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        console.log("[Bridge] 📥 Received:", msg);

        dispatchSignal(msg.type, msg.payload); // Dispatch signal for any message type

        // switch (msg.type) {
        //   case "STATE_UPDATE":
        //     applyAgentUpdate(msg.payload);
        //     break;

        //   case "FORM_PREFILL":
        //     // 1. Update Data (State)
        //     updateForm(msg.payload.formId, msg.payload.values);
            
        //     // 2. Dispatch Signal (Instead of eventBus.emit)
        //     dispatchSignal("FORM_PREFILL", msg.payload);
        //     break;

        //   case "UI_ACTION":
        //     // UI Actions can also go via signal if you want visuals centrally managed,
        //     // OR direct DOM action if immediate.
        //     // For consistency, let's dispatch signal here too:
        //     dispatchSignal("UI_ACTION", msg);
            
        //     // OR keep direct if it's purely imperative:
        //     // if (msg.action === "SCROLL_TO") elementRegistry.scrollTo(msg.target);
        //     break;
        // }
      } catch (e) {
        console.error("[Bridge] Error", e);
      }
    };

    room.on("dataReceived", handleData);
    return () => {
      room.off("dataReceived", handleData);
    };
  }, [room, applyAgentUpdate, updateForm, dispatchSignal]);
}