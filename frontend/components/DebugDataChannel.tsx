// components/DebugDataChannel.tsx

"use client";

import { useRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";

/**
 * Debug component to test data channel connectivity
 * Add this temporarily to AgentChatUI to test
 */
export function DebugDataChannel() {
  const room = useRoomContext();
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    if (!room) return;

    console.log("🔵 [DEBUG] Room connected, setting up data listener");

    const handleDataReceived = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      console.log("🟢 [DEBUG] Data received - Topic:", topic, "From:", participant?.identity);
      
      if (topic === "agent-bridge") {
        const decoder = new TextDecoder();
        const messageStr = decoder.decode(payload);
        console.log("🟢 [DEBUG] Agent-bridge message:", messageStr);
        setLastMessage(messageStr.substring(0, 100));
        setMessageCount(prev => prev + 1);
      }
    };

    room.on("dataReceived", handleDataReceived);

    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room]);

  return (
    <div className="p-2 bg-yellow-500 text-black text-xs">
      <p>🔍 Room Status: {room ? "✅ Connected" : "❌ Not Connected"}</p>
      <p>📩 Messages Received: {messageCount}</p>
      <p>📝 Last Message: {lastMessage ? lastMessage : "None"}</p>
    </div>
  );
}
