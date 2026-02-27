"use client"
// components/AgentChatWithSession.tsx

import React, { useCallback, useMemo, useState } from 'react'
import { TokenSource } from 'livekit-client'
import {
  useSession,
  useSessionContext,
  useVoiceAssistant,
  useParticipants,
  useTrackToggle,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Mic, MicOff } from 'lucide-react'
import { PiPlugsBold, PiPlugsConnectedFill } from 'react-icons/pi'
import { APP_CONFIG_DEFAULTS } from '@/app-config'
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider'
import { AgentBridgeProvider } from '@/components/AgentBridgeProvider'
import AgentChatUI from '@/components/AgentChatUI'

// ─── Agent state → visual config ──────────────────────────────────────────────

type AgentStatus = 'offline' | 'connecting' | 'listening' | 'thinking' | 'speaking'

function resolveStatus(isConnected: boolean, agentJoined: boolean, state: string): AgentStatus {
  if (!isConnected)              return 'offline'
  if (!agentJoined)              return 'connecting'
  if (state === 'thinking')      return 'thinking'
  if (state === 'speaking')      return 'speaking'
  return 'listening'
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; pulse: boolean; fast: boolean }> = {
  offline:    { label: 'Offline',     color: 'var(--color-text-muted)',    pulse: false, fast: false },
  connecting: { label: 'Connecting',  color: '#F59E0B',                    pulse: true,  fast: false },
  listening:  { label: 'Listening',   color: 'var(--color-primary)',       pulse: true,  fast: false },
  thinking:   { label: 'Thinking',    color: '#F59E0B',                    pulse: true,  fast: true  },
  speaking:   { label: 'Speaking',    color: '#22C55E',                    pulse: true,  fast: true  },
}

// ─── ResizableContainer ────────────────────────────────────────────────────────

type ResizableContainerProps = {
  children:    React.ReactNode
  isConnected: boolean
  agentJoined: boolean
  agentState:  string
  micEnabled:  boolean
  micPending:  boolean
  toggleMic:   () => void
  onConnect:   () => void
  onDisconnect: () => void
}

function ResizableContainer({ children, isConnected, agentJoined, agentState, micEnabled, micPending, toggleMic, onConnect, onDisconnect }: ResizableContainerProps) {
  const [collapsed, setCollapsed] = useState(false)

  const status = resolveStatus(isConnected, agentJoined, agentState)
  const cfg    = STATUS_CONFIG[status]

  return (
    <div className="relative shrink-0 h-screen flex overflow-visible">

      {/* ── Chat panel ── */}
      <div
        className="h-full overflow-hidden bg-card border-r border-border"
        style={{
          width:      collapsed ? '0px' : '300px',
          opacity:    collapsed ? 0 : 1,
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        }}
      >
        <div className="w-75 h-full">
          {children}
        </div>
      </div>

      {/* ── Collapsed strip + Toggle button wrapper ── */}
      <div
        className="relative h-full shrink-0 overflow-visible"
        style={{
          width:      collapsed ? '44px' : '0px',
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Strip content — 3 equal flex-1 sections */}
        <div
          className="h-full bg-background-subtle border-r border-border
                     flex flex-col overflow-hidden"
          style={{
            width:         '44px',
            opacity:       collapsed ? 1 : 0,
            pointerEvents: collapsed ? 'auto' : 'none',
            transition:    'opacity 0.2s ease',
          }}
        >

          {/* SECTION 1 — top aligned, content at top-center */}
          <div className="flex-1 flex flex-col items-center justify-start pt-5">
            <span
              className="text-[10px] font-semibold tracking-[3px] uppercase text-text-muted select-none whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Chat
            </span>
          </div>

          {/* SECTION 2 — center aligned, buttons in middle */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3">

            {/* Connect / Disconnect */}
            <button
              onClick={() => isConnected ? onDisconnect() : onConnect()}
              disabled={isConnected && !agentJoined}
              title={isConnected ? 'Disconnect' : 'Connect'}
              className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed"
              style={isConnected
                ? { background: 'color-mix(in srgb, #EF4444 12%, transparent)', borderColor: '#EF444466', color: '#EF4444' }
                : { background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--color-primary) 40%, transparent)', color: 'var(--color-primary)' }
              }
            >
              {isConnected ? <PiPlugsConnectedFill size={15} /> : <PiPlugsBold size={15} />}
            </button>

            {/* Mic toggle */}
            <button
              onClick={toggleMic}
              disabled={!isConnected || micPending}
              title={micEnabled ? 'Mute mic' : 'Unmute mic'}
              className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200
                         disabled:opacity-30 disabled:cursor-not-allowed"
              style={micEnabled
                ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-fg)' }
                : { background: 'transparent',          borderColor: 'var(--color-border)',  color: 'var(--color-text-muted)' }
              }
            >
              {micEnabled ? <Mic size={15} /> : <MicOff size={15} />}
            </button>

          </div>

          {/* SECTION 3 — bottom aligned, content at bottom-center */}
          <div className="flex-1 flex flex-col items-center justify-end pb-5">
            <span
              className="font-medium select-none whitespace-nowrap capitalize"
              style={{
                fontSize:    '10px',
                color:       cfg.color,
                writingMode: 'vertical-rl',
                transform:   'rotate(180deg)',
                transition:  'color 0.3s ease',
              }}
            >
              {cfg.label}
            </span>
            <div
              className="mt-2"
              style={{
                width:           '7px',
                height:          '7px',
                borderRadius:    '50%',
                backgroundColor: cfg.color,
                flexShrink:      0,
                animation:       cfg.pulse
                  ? `pulse ${cfg.fast ? '0.8s' : '1.8s'} ease-in-out infinite`
                  : 'none',
              }}
            />
          </div>

        </div>

        {/* Toggle button — right edge, vertically centered */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          title={collapsed ? 'Open chat' : 'Close chat'}
          className="absolute top-1/2 -translate-y-1/2 z-50 cursor-pointer group"
          style={{ right: '-20px' }}
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
                transform:  collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
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

    </div>
  )
}

// ─── ConnectedResizableContainer ──────────────────────────────────────────────
// Must live inside AgentSessionProvider so LiveKit hooks have their context.

function ConnectedResizableContainer({ children }: { children: React.ReactNode }) {
  const session      = useSessionContext()
  const { state }    = useVoiceAssistant()
  const participants = useParticipants()
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

  const isConnected = session.isConnected
  const agentJoined = participants.some(p => p.isAgent)

  return (
    <ResizableContainer
      isConnected={isConnected}
      agentJoined={agentJoined}
      agentState={state}
      micEnabled={micToggle.enabled}
      micPending={micToggle.pending}
      toggleMic={handleMicToggle}
      onConnect={session.start}
      onDisconnect={session.end}
    >
      {children}
    </ResizableContainer>
  )
}

// ─── AgentChatWithSession ─────────────────────────────────────────────────────

export default function AgentChatWithSession() {
  const tokenSource = useMemo(() => TokenSource.endpoint('/api/connection-details'), [])

  const session = useSession(
    tokenSource,
    APP_CONFIG_DEFAULTS.agentName ? { agentName: APP_CONFIG_DEFAULTS.agentName } : undefined,
  )

  return (
    <AgentSessionProvider session={session}>
      <AgentBridgeProvider>
        <ConnectedResizableContainer>
          <AgentChatUI />
        </ConnectedResizableContainer>
      </AgentBridgeProvider>
    </AgentSessionProvider>
  )
}