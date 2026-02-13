"use client";

import { useEffect, useRef } from "react";
import { Plug, PlugZap } from "lucide-react";
import { useSessionContext, useSessionMessages, useVoiceAssistant } from "@livekit/components-react";
import { useParticipants } from "@livekit/components-react";
import AgentChatInput from "./AgentChatInput";
import AgentUIHeader from "./agents-ui/agent-chat-header";
import { AgentMessagesContainer } from "./agents-ui/agent-messages-container";

export default function AgentChatUI() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { isConnected, start, end } = session;
  const participants = useParticipants();

  const { state, audioTrack } = useVoiceAssistant();
  
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
    <div className="h-full flex flex-col bg-card">
      <AgentUIHeader isConnected={isConnected} agentJoined={agentJoined} state={state} start={start} end={end} />

      <AgentMessagesContainer scrollAreaRef={scrollAreaRef} messages={messages} isConnected={isConnected} agentJoined={agentJoined} />

      {/* Input Section */}
      <AgentChatInput isConnected={isConnected} agentJoined={agentJoined} />
    </div>
  );
}
