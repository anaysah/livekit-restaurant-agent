import React from 'react'
import { useParticipants } from '@livekit/components-react';
import { useAgentAudioToggle } from '@/hooks/useAgentAudioToggle';
import { PiPlugsBold, PiPlugsConnectedFill } from 'react-icons/pi';
import { FaVolumeUp } from 'react-icons/fa';
import { FaVolumeXmark } from 'react-icons/fa6';

type AgentUIHeaderProps = {
  isConnected: boolean;
  agentJoined: boolean;
  state: string;
  participants: ReturnType<typeof useParticipants>;
  start: () => void;
  end: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  disconnected: 'Offline',
  connecting:   'Connecting...',
  initializing: 'Waking up...',
  listening:    'Listening',
  thinking:     'Thinking...',
  speaking:     'Speaking...',
}

const AgentUIHeader = ({ isConnected, agentJoined, state, participants, start, end }: AgentUIHeaderProps) => {
  const { isAgentMuted, toggleAgentAudio } = useAgentAudioToggle();

  const statusLabel = isConnected
    ? (agentJoined ? (STATUS_LABEL[state] ?? state) : 'Agent joining...')
    : 'Offline'

  const dotColor = isConnected && agentJoined
    ? state === 'listening' || state === 'speaking'
      ? 'bg-green-400'
      : 'bg-yellow-400'
    : 'bg-red-400'

  return (
    <div
      className="flex-shrink-0 border-b border-border px-4 py-3"
      style={{
        background: 'var(--nav-blur-bg, rgba(250,247,242,0.85))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center justify-between">

        {/* Left: Logo + name */}
        <div className="flex items-center gap-2.5">
          {/* Mini logo — matches site nav style */}
          <div
            className="text-sm font-bold tracking-[2px] text-foreground leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            TER<span className="text-primary">R</span>A
          </div>

          {/* Thin divider */}
          <div className="w-px h-4 bg-border" />

          {/* Status pill */}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor} ${
              isConnected && agentJoined ? 'animate-pulse' : ''
            }`} />
            <span className="text-[11px] text-text-muted capitalize tracking-wide">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Volume toggle */}
          <button
            onClick={toggleAgentAudio}
            disabled={!isConnected || !agentJoined}
            title={isAgentMuted ? 'Unmute Agent' : 'Mute Agent'}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       border border-border
                       hover:border-primary hover:text-primary
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
            style={{ background: 'transparent' }}
          >
            {isAgentMuted
              ? <FaVolumeXmark size={15} className="text-red-400" />
              : <FaVolumeUp    size={15} className="text-text-muted" />
            }
          </button>

          {/* Connect / Disconnect */}
          <button
            onClick={() => isConnected ? end() : start()}
            disabled={isConnected && !agentJoined}
            title={isConnected ? 'Disconnect' : 'Connect'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center border
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition-all duration-150
                        ${isConnected
                          ? 'border-green-500/40 bg-green-500/10 hover:bg-red-500/10 hover:border-red-400/40'
                          : 'border-border hover:border-primary hover:bg-primary/10'
                        }`}
            style={{ background: isConnected ? undefined : 'transparent' }}
          >
            {isConnected
              ? <PiPlugsConnectedFill size={16} className="text-green-500" />
              : <PiPlugsBold          size={16} className="text-red-400" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default AgentUIHeader