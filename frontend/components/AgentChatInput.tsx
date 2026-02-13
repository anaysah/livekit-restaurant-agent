"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useChat, useTrackToggle, usePersistentUserChoices } from "@livekit/components-react";
import { Track } from "livekit-client";

interface AgentChatInputProps {
  isConnected: boolean;
  agentJoined: boolean;
}

export default function AgentChatInput({ isConnected, agentJoined }: AgentChatInputProps) {
  const [message, setMessage] = useState("");
  const { send } = useChat();
  
  
  
  // Mic toggle with error handling
  const microphoneToggle = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: (error) => {
      console.error("Microphone error:", error);
      alert(`Cannot access microphone: ${error.message}`);
    },
  });

  // Enhanced toggle with persistence
  const handleMicToggle = useCallback(async () => {
    try {
      await microphoneToggle.toggle();
    } catch (error) {
      console.error("Failed to toggle microphone:", error);
    }
  }, [microphoneToggle]);

  const isDisabled = !isConnected || !agentJoined;

  const handleSendMessage = async () => {
    if (message.trim()) {
      try {
        await send(message.trim());
        setMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  return (
    <div className="p-1 px-2 border-t border-border bg-background-light">
      <div className="flex items-center gap-1">
        {/* Mic Toggle Button */}
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

        {/* Text Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder={isDisabled ? "Waiting for agent..." : "Type your message..."}
          disabled={isDisabled}
          className="flex-1 px-2 py-1 rounded-sm border border-border bg-background text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || isDisabled}
          className=" text-primary disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-70 transition-opacity">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
