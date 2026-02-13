import React from 'react'

type AgentMessagesContainerProps = {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  messages: Array<{
    from?: { isLocal: boolean };
    message: string;
    timestamp?: number;
  }>;
  isConnected: boolean;
  agentJoined: boolean;
}

export const AgentMessagesContainer = ({ scrollAreaRef, messages, isConnected, agentJoined }: AgentMessagesContainerProps) => {
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

