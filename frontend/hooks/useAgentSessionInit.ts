// hooks/useAgentSessionInit.ts
"use client";

import { useEffect, useRef } from "react";
import { useRoomContext, useParticipants } from "@livekit/components-react";
import { useAppStore } from "@/lib/store/app-store";
import { UI_TO_AGENT_EVENTS, UI_TO_AGENT_TOPIC_NAME } from "@/lib/constants";

/**
 * Fires once when the agent first joins the room.
 * Sends a SESSION_SYNC message with the current page and any pre-filled form values
 * so the agent can populate UserData before its opening reply.
 */
export function useAgentSessionInit() {
  const room = useRoomContext();
  const participants = useParticipants();
  const forms = useAppStore((s) => s.forms);
  const currentPage = useAppStore((s) => s.currentPage);
  const initSentRef = useRef(false);

  const agentJoined = participants.some((p) => p.isAgent);

  // Send SESSION_SYNC once when the agent joins
  useEffect(() => {
    if (!agentJoined || !room || initSentRef.current) return;

    // Only include forms that have at least one filled value
    const nonEmptyForms: Record<string, Record<string, unknown>> = {};
    for (const [formId, values] of Object.entries(forms)) {
      const filled = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== null && v !== undefined && v !== "")
      );
      if (Object.keys(filled).length > 0) {
        nonEmptyForms[formId] = filled;
      }
    }

    const msg = {
      type: UI_TO_AGENT_EVENTS.SESSION_SYNC,
      payload: {
        page: currentPage || null,
        forms: nonEmptyForms,
      },
    };

    console.log("[Bridge] 📤 SESSION_SYNC on agent join:", msg);
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(msg)),
      { reliable: true, topic: UI_TO_AGENT_TOPIC_NAME }
    );
    initSentRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentJoined]);

  // Reset ref on disconnect so next connect gets a fresh sync
  useEffect(() => {
    if (!agentJoined) initSentRef.current = false;
  }, [agentJoined]);
}
