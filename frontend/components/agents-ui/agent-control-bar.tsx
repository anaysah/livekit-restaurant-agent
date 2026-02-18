"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useChat, useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";

interface AgentControlBarProps {
  isConnected: boolean;
  agentJoined: boolean;
}

export default function AgentControlBar({ isConnected, agentJoined }: AgentControlBarProps) {
  const [message, setMessage] = useState("");
  const { send, isSending } = useChat(); // Use isSending from useChat
  const isSendingRef = useRef(false); // Additional safeguard
  
  const microphoneToggle = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: (error) => {
      console.error("Microphone error:", error);
      alert(`Cannot access microphone: ${error.message}`);
    },
  });

  const handleMicToggle = useCallback(async () => {
    try {
      await microphoneToggle.toggle();
    } catch (error) {
      console.error("Failed to toggle microphone:", error);
    }
  }, [microphoneToggle]);

  const isDisabled = !isConnected || !agentJoined;

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending || isSendingRef.current) {
      return;
    }

    // Request track karne ke liye
    const timestamp = new Date().toISOString();
    const requestId = crypto.randomUUID();
    
    console.log('🚀 REQUEST SENT:', {
      timestamp,
      requestId,
      message: message.trim(),
      isSending,
      isSendingRef: isSendingRef.current
    });

    isSendingRef.current = true;
    
    try {
      await send(message.trim());
      console.log('✅ REQUEST SUCCESS:', requestId);
      setMessage("");
    } catch (error) {
      console.error('❌ REQUEST FAILED:', requestId, error);
    } finally {
      console.log('🏁 REQUEST COMPLETE:', requestId);
      isSendingRef.current = false;
    }
  }, [message, send, isSending]);


  return (
    <div className="p-1 px-2 border-t border-border bg-background-light">
      <div className="flex items-center gap-1">
        <button
          onClick={handleMicToggle}
          disabled={isDisabled || microphoneToggle.pending}
          className={`p-2 rounded-sm transition-all ${
            microphoneToggle.enabled
              ? "text-white"
              : "bg-background-light text-foreground"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={microphoneToggle.enabled ? "Mute microphone" : "Unmute microphone"}
        >
          {microphoneToggle.pending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : microphoneToggle.enabled ? (
            <Mic size={20} />
          ) : (
            <MicOff size={20} />
          )}
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
          placeholder={isDisabled ? "Waiting for agent..." : "Type your message..."}
          disabled={isDisabled || isSending}
          className="flex-1 px-2 py-1 rounded-sm border border-border bg-background text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || isDisabled || isSending}
          className="text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-70 transition-opacity">
          {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
