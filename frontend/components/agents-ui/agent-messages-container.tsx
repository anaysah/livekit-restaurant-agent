import React, { useEffect, useRef } from 'react'

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

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export const AgentMessagesContainer = ({ messages, isConnected, agentJoined }: AgentMessagesContainerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (scrollRef.current)
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }, 0)
    }
  }, [messages])

  /* ── Empty state ── */
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 bg-background">
        <div className="w-14 h-14 rounded-2xl bg-background-subtle border border-border
                        flex items-center justify-center text-3xl">
          {!isConnected ? '🔌' : agentJoined ? '🎙️' : '⏳'}
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">
            {!isConnected
              ? 'Not connected'
              : agentJoined
              ? 'Ready to chat'
              : 'Agent is joining...'}
          </p>
          <p className="text-xs text-text-muted leading-relaxed max-w-[200px]">
            {!isConnected
              ? 'Press connect to start your session with Terra.'
              : agentJoined
              ? 'Ask me anything about our menu, reservations or specials.'
              : 'Just a moment, setting things up for you...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-background px-3 py-4 space-y-3"
      style={{ scrollbarWidth: 'thin' }}
    >
      {messages.map((msg, idx) => {
        const isUser = msg.from?.isLocal === true
        const key = msg.id || `${msg.timestamp}-${idx}`

        // Show timestamp only if gap > 2 min from previous
        const prev = messages[idx - 1]
        const showTime = !prev || (msg.timestamp - prev.timestamp) > 2 * 60 * 1000

        return (
          <div key={key}>
            {/* Timestamp divider */}
            {showTime && (
              <div className="flex items-center justify-center my-2">
                <span className="text-[10px] text-text-muted bg-background px-2">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )}

            <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>

              {/* Agent avatar
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-background-subtle border border-border
                                flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                  🍽️
                </div>
              )} */}

              {/* Bubble */}
              <div
                className={`
                  max-w-[82%] px-3 py-2 text-sm leading-relaxed
                  ${isUser
                    ? 'bg-primary text-primary-fg rounded-2xl rounded-br-sm'
                    : 'bg-card border border-border text-text-main rounded-2xl rounded-bl-sm'
                  }
                `}
                style={{ wordBreak: 'break-word' }}
              >
                {msg.message}
              </div>

              {/* User avatar placeholder
              {isUser && (
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30
                                flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                  👤
                </div>
              )} */}
            </div>
          </div>
        )
      })}
    </div>
  )
}