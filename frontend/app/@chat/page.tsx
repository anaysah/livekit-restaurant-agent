"use client"
// @chat/page.tsx

import React, { useMemo, useState } from 'react'
import { TokenSource } from 'livekit-client'
import { useSession } from '@livekit/components-react'
import { APP_CONFIG_DEFAULTS } from '@/app-config'
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider'
import { AgentBridgeProvider } from '@/components/AgentBridgeProvider'
import AgentChatUI from '@/components/AgentChatUI'

export default function ChatSlot() {
  return <ChatWithSession />
}


function ResizableContainer({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    /*
      overflow-visible on this wrapper is critical —
      without it the toggle button gets clipped at the edge
    */
    <div className="relative flex-shrink-0 h-screen flex overflow-visible">

      {/* ── Chat panel ── */}
      <div
        className="h-full overflow-hidden bg-card border-r border-border"
        style={{
          width: collapsed ? '0px' : '300px',
          opacity: collapsed ? 0 : 1,
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        }}
      >
        {/* Fixed inner width prevents content squishing during animation */}
        <div className="w-[300px] h-full">
          {children}
        </div>
      </div>

      {/* ── Collapsed strip — visible only when collapsed ── */}
      <div
        className="h-full flex-shrink-0 bg-background-subtle border-r border-border
                   flex flex-col items-center justify-between py-5 overflow-hidden"
        style={{
          width: collapsed ? '44px' : '0px',
          opacity: collapsed ? 1 : 0,
          pointerEvents: collapsed ? 'auto' : 'none',
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        }}
      >
        {/* Rotated "Chat" label */}
        <span
          className="text-[10px] font-semibold tracking-[3px] uppercase text-text-muted select-none whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Chat
        </span>

        {/* Pulsing live dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>

      {/* ── Toggle button ──
          Positioned so its LEFT edge aligns with the sidebar's right border.
          The pill is rounded on the RIGHT only, so it looks like it grows
          out of the sidebar wall — exactly like VS Code / Notion sidebars.
      ── */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        title={collapsed ? 'Open chat' : 'Close chat'}
        className="absolute top-1/2 -translate-y-1/2 z-50 cursor-pointer group"
        style={{
          // When open:      300px sidebar — button flush with its right border
          // When collapsed: 44px strip   — button flush with its right border
          left: collapsed ? '44px' : '300px',
          transition: 'left 0.3s ease',
        }}
      >
        <div
          className="
            h-10 w-5
            bg-card
            border-y border-r border-border
            rounded-r-full
            flex items-center justify-center
            shadow-sm
            group-hover:border-primary
            group-hover:shadow-md
            
            transition-all duration-200
          "
        >
          <svg
            width="8" height="12"
            viewBox="0 0 8 12"
            fill="none"
            className="text-text-muted group-hover:text-primary transition-colors duration-150"
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            }}
          >
            <path
              d="M2 2L6 6L2 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

    </div>
  )
}

function ChatWithSession() {
  const tokenSource = useMemo(() => {
    return TokenSource.endpoint('/api/connection-details')
  }, [])

  const session = useSession(
    tokenSource,
    APP_CONFIG_DEFAULTS.agentName ? { agentName: APP_CONFIG_DEFAULTS.agentName } : undefined
  )

  return (
    <AgentSessionProvider session={session}>
      <AgentBridgeProvider>
        <ResizableContainer>
          <AgentChatUI />
        </ResizableContainer>
      </AgentBridgeProvider>
    </AgentSessionProvider>
  )
}