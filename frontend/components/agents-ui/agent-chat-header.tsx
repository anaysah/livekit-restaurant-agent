import React, { useState, useCallback } from 'react'
import { Plug, PlugZap } from "lucide-react";
import { PiPlugsBold, PiPlugsConnectedFill } from 'react-icons/pi';
import { FaVolumeUp } from 'react-icons/fa';
import { FaVolumeXmark } from 'react-icons/fa6';
import { useParticipants } from '@livekit/components-react';

type AgentUIHeaderProps = {
  isConnected: boolean;
  agentJoined: boolean;
  state: string;
  start: () => void;
  end: () => void;
}

const AgentUIHeader = ({ isConnected, agentJoined, state, start, end }: AgentUIHeaderProps) => {
  const [isAgentMuted, setIsAgentMuted] = useState(false);
  const participants = useParticipants();

  const handleAgentAudioToggle = useCallback(() => {
    const agentParticipant = participants.find((p) => p.isAgent);

    if (agentParticipant) {
      agentParticipant.audioTrackPublications.forEach((publication) => {
        if (publication.audioTrack) {
          const audioElements = publication.audioTrack.attachedElements;

          audioElements.forEach((element) => {
            if (element instanceof HTMLAudioElement) {
              element.volume = isAgentMuted ? 1 : 0;
            }
          });
        }
      });

      setIsAgentMuted(!isAgentMuted);
    }
  }, [participants, isAgentMuted]);



  return (

    <div className="p-4 border-b border-border bg-background-light">
      <div className="flex items-center justify-between items-stretch">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            AI Agent Chat
          </h2>
          <button
            onClick={handleAgentAudioToggle}
            className="ml-2 p-1 hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isConnected || !agentJoined}
            title={isAgentMuted ? "Unmute Agent" : "Mute Agent"}
          >
            {isAgentMuted ? (
              <FaVolumeXmark size={18} className="text-red-500" />
            ) : (
              <FaVolumeUp size={18} className="text-foreground" />
            )}
          </button>
        </div>
        <button
          onClick={() => isConnected ? end() : start()}
          className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isConnected ? "Disconnect" : "Connect"}
          disabled={isConnected && !agentJoined}
        >
          {isConnected ? (
            // <PlugZap size={20} className="text-green-500" />
            <PiPlugsConnectedFill size={20} className="text-green-500 " />
          ) : (
            // <Plug size={20} className="text-gray-400" />
            <PiPlugsBold size={20} className="text-red-500" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between">
        {/* <span className="text-xs text-text-muted mt-1">
          {isConnected ? (agentJoined ? "Online" : "Joining...") : "Offline"}
        </span> */}
        <span className="text-xs text-text-muted capitalize">{state}</span>
      </div>
    </div>
  )
}

export default AgentUIHeader