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
  const { send, isSending } = useChat();
  const isSendingRef = useRef(false);

  const micToggle = useTrackToggle({
    source: Track.Source.Microphone,
    onDeviceError: (error) => {
      console.error("Microphone error:", error);
      alert(`Cannot access microphone: ${error.message}`);
    },
  });

  const handleMicToggle = useCallback(async () => {
    try { await micToggle.toggle() }
    catch (e) { console.error("Mic toggle failed:", e) }
  }, [micToggle]);

  const isDisabled = !isConnected || !agentJoined;

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending || isSendingRef.current) return;
    isSendingRef.current = true;
    try {
      await send(message.trim());
      setMessage("");
    } catch (e) {
      console.error("Send failed:", e);
    } finally {
      isSendingRef.current = false;
    }
  }, [message, send, isSending]);

  const micActive = micToggle.enabled;

  return (
    <div className="flex-shrink-0 px-3 py-3 border-t border-border bg-card">

      {/* Input row */}
      <div className="flex items-center gap-2">

        {/* Mic button */}
        <button
          onClick={handleMicToggle}
          disabled={isDisabled || micToggle.pending}
          title={micActive ? 'Mute microphone' : 'Unmute microphone'}
          className={`
            w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center border
            transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed
            ${micActive
              ? 'bg-primary border-primary text-primary-fg shadow-sm'
              : 'bg-background-subtle border-border text-text-secondary hover:border-primary hover:text-primary'
            }
          `}
        >
          {micToggle.pending
            ? <Loader2 size={15} className="animate-spin" />
            : micActive
            ? <Mic    size={15} />
            : <MicOff size={15} />
          }
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !isSending && handleSend()}
            placeholder={isDisabled ? 'Waiting for agent...' : 'Ask me anything...'}
            disabled={isDisabled || isSending}
            className="
              w-full px-3 py-2 pr-2
              rounded-xl border border-border
              bg-background text-foreground text-sm
              placeholder:text-text-muted
              focus:outline-none focus:border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
            "
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isDisabled || isSending}
          title="Send message"
          className="
            w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
            bg-primary text-primary-fg border border-primary
            hover:bg-primary-hover hover:border-primary-hover
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm
          "
        >
          {isSending
            ? <Loader2 size={15} className="animate-spin" />
            : <Send    size={15} />
          }
        </button>
      </div>

      {/* Hint text */}
      <p className="text-[10px] text-text-muted text-center mt-2 leading-none">
        {isDisabled
          ? 'Connect to start your session'
          : 'Enter to send · Mic for voice'
        }
      </p>
    </div>
  );
}