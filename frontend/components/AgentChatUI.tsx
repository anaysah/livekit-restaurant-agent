"use client";

// components/AgentChatUI.tsx

import { useSessionContext, useSessionMessages, useVoiceAssistant } from "@livekit/components-react";
import { useParticipants } from "@livekit/components-react";
import AgentUIHeader from "@/components/agents-ui/agent-chat-header";
import { AgentMessagesContainer } from "@/components/agents-ui/agent-messages-container";
import AgentControlBar from "@/components/agents-ui/agent-control-bar";
import { DebugDataChannel } from "@/components/DebugDataChannel";

export default function AgentChatUI() {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { isConnected, start, end } = session;
  const participants = useParticipants();

  const { state, audioTrack } = useVoiceAssistant();
  
  // Check if agent has joined
  const agentParticipant = participants.find((p) => p.isAgent);
  const agentJoined = !!agentParticipant;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Debug Component - Remove after testing */}
      <DebugDataChannel />
      
      <AgentUIHeader isConnected={isConnected} agentJoined={agentJoined} state={state} participants={participants} start={start} end={end} />

      <AgentMessagesContainer messages={messages} isConnected={isConnected} agentJoined={agentJoined} />

      {/* Input Section */}
      <AgentControlBar isConnected={isConnected} agentJoined={agentJoined} />
    </div>
  );
}
