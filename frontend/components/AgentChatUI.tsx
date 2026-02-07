"use client";

import { useEffect, useRef } from "react";
import { Plug, PlugZap } from "lucide-react";
import { useSessionContext, useSessionMessages } from "@livekit/components-react";
import { useParticipants } from "@livekit/components-react";
import AgentChatInput from "./AgentChatInput";

export default function AgentChatUI() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { isConnected, start, end } = session;
  const participants = useParticipants();
  
  // Check if agent has joined
  const agentParticipant = participants.find((p) => p.isAgent);
  const agentJoined = !!agentParticipant;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-[var(--color-card)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-background-light)]">
        <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">
          AI Agent Chat
        </h2>
        <button 
          onClick={() => isConnected ? end() : start()} 
          className="mt-2 transition-colors"
          title={isConnected ? "Disconnect" : "Connect"}
        >
          {isConnected ? (
            <PlugZap size={20} className="text-green-500" />
          ) : (
            <Plug size={20} className="text-gray-400" />
          )}
        </button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {isConnected ? "Online" : "Offline"}
        </p>
      </div>

      {/* Messages Container */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-1 space-y-2 bg-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-sm">
            {!isConnected 
              ? "Connect to start chatting" 
              : agentJoined 
                ? "Agent is listening, start chatting..." 
                : "Agent is joining..."}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.from?.isLocal === true;
            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-sm p-2 ${
                    isUser
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-background-light)] border border-[var(--color-border)]"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  {msg.timestamp && (
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Section */}
      <AgentChatInput isConnected={isConnected} agentJoined={agentJoined} />
    </div>
  );
}
