// hooks/useAgentBridge.ts
"use client";

import { useEffect } from "react";
import { useRoomContext } from "@livekit/components-react";
import { useAppStore } from "@/lib/store/app-store";
import type { UIToAgentMessage } from "@/types/agent-bridge";
import { DataPacket_Kind, Encryption_Type, RemoteParticipant } from "livekit-client";
import { AGENT_UI_TOPIC_NAME, UI_TO_AGENT_TOPIC_NAME } from "@/lib/constants";

export function useAgentBridge() {
  const room = useRoomContext();
  const applyAgentUpdate = useAppStore((s) => s.applyAgentUpdate);
  const updateForm = useAppStore((s) => s.updateForm);
  const dispatchSignal = useAppStore((s) => s.dispatchSignal);
  const outboundSignal = useAppStore((s) => s.outboundSignal);

  // 1. OUTGOING: Watch outboundSignal -> Send to Agent
  // Only fires when an explicit dispatchOutboundSignal() is called
  useEffect(() => {
    if (!room || !outboundSignal) return;

    const msg: UIToAgentMessage = {
      type: outboundSignal.type as any,
      payload: outboundSignal.payload,
    };

    console.log("[Bridge] 📤 Sending:", msg);
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(msg)),
      { reliable: true, topic: UI_TO_AGENT_TOPIC_NAME }
    );
  }, [outboundSignal, room]);

  // 2. INCOMING: Agent -> Store/Action
  useEffect(() => {
    if (!room) return;

    const handleData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      kind?: DataPacket_Kind,
      topic?: string,
      encryptionType?: Encryption_Type
    ) => {
      if (topic !== AGENT_UI_TOPIC_NAME) return;
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        console.log("[Bridge] 📥 Received:", msg);
        dispatchSignal(msg.type, msg.payload);
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