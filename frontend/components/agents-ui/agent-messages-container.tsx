import React, { useEffect, useRef } from 'react'

/**
 * Represents a received message in the chat
 */
export interface ReceivedMessage {
  id?: string;
  timestamp: number;
  from?: {
    identity?: string;
    isLocal: boolean;
  };
  message: string;
}

type AgentMessagesContainerProps = {
  messages: ReceivedMessage[];
  isConnected: boolean;
  agentJoined: boolean;
}

export const AgentMessagesContainer = ({ messages, isConnected, agentJoined }: AgentMessagesContainerProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages]);

  return (
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-1 space-y-2 bg-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            {!isConnected 
              ? "Connect to start chatting" 
              : agentJoined 
                ? "Agent is listening, start chatting..." 
                : "Agent is joining..."}
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.from?.isLocal === true;
            // Use unique key: id if available, otherwise timestamp, fallback to timestamp + message hash
            const messageKey = msg.id || `${msg.timestamp}-${msg.message.slice(0, 10)}`;
            
            return (
              <div
                key={messageKey}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-sm p-2 ${
                    isUser
                      ? "bg-primary text-white"
                      : "bg-background-light border border-border"
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
  )
}

