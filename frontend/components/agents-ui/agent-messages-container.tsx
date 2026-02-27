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

/* ── Tiling doodle pattern (WhatsApp-style) ── */
const DOODLES = [
  '/doodles/pizza-slice.svg',
  '/doodles/pizza.svg',
  '/doodles/egg.svg',
  '/doodles/soup.svg',
  '/doodles/taco.svg',
  '/doodles/square-sandwich.svg',
  '/doodles/toast.svg',
  '/doodles/pancake.svg',
  '/doodles/coffee-cup.svg',
  '/doodles/burger.svg',
]
const ROTATIONS = [-20, 12, -5, 28, -15, 8, -32, 22, -10, 30, -24, 6, 18, -8, 25]

function buildPatternItems() {
  const CELL_W = 88
  const CELL_H = 92
  const COLS    = 7
  const ROWS    = 18   // enough to fill any chat height
  const SIZE    = 50   // all doodles same size

  const items: { src: string; x: number; y: number; rotate: number; size: number }[] = []
  let idx = 0

  for (let row = 0; row < ROWS; row++) {
    // every other row offset by half a cell → staggered hex-like grid
    const offsetX = (row % 2 === 0) ? 0 : CELL_W / 2
    for (let col = 0; col < COLS; col++) {
      items.push({
        src:    DOODLES[idx % DOODLES.length],
        x:      col * CELL_W + offsetX,
        y:      row * CELL_H,
        rotate: ROTATIONS[idx % ROTATIONS.length],
        size:   SIZE,
      })
      idx++
    }
  }
  return items
}

const PATTERN_ITEMS = buildPatternItems()

function ChatDoodlePattern() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        userSelect: 'none',
      }}
    >
      {PATTERN_ITEMS.map((item, i) => (
        <img
          key={i}
          src={item.src}
          alt=""
          width={item.size}
          height={item.size}
          draggable={false}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            width: item.size,
            height: item.size,
            opacity: 'var(--doodle-opacity, 0.055)',
            filter: 'var(--doodle-filter, none)',
            transform: `rotate(${item.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
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
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 bg-background relative">
        <ChatDoodlePattern />
        <div className="relative z-10 w-14 h-14 rounded-2xl bg-background-subtle border border-border
                        flex items-center justify-center text-3xl">
          {!isConnected ? '🔌' : agentJoined ? '🎙️' : '⏳'}
        </div>
        <div className="relative z-10 text-center">
          <p className="text-sm font-medium text-foreground mb-1">
            {!isConnected
              ? 'Not connected'
              : agentJoined
              ? 'Ready to chat'
              : 'Agent is joining...'}
          </p>
          <p className="text-xs text-text-muted leading-relaxed max-w-50">
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
    <div className="flex-1 relative bg-background overflow-hidden">
      <ChatDoodlePattern />
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto px-3 py-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="relative z-10 space-y-3">
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
      </div>{/* end z-10 wrapper */}
      </div>{/* end scroll div */}
    </div>  
  )
}