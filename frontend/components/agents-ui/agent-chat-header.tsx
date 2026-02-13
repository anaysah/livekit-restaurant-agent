import React from 'react'
import { Plug, PlugZap } from "lucide-react";
import { PiPlugsBold, PiPlugsConnectedFill } from 'react-icons/pi';

type AgentUIHeaderProps = {
  isConnected: boolean;
  agentJoined: boolean;
  state: string;
  start: () => void;
  end: () => void;
}

const AgentUIHeader = ({ isConnected, agentJoined, state, start, end }: AgentUIHeaderProps) => {
  return (

    <div className="p-4 border-b border-border bg-background-light">
      <div className="flex items-center justify-between items-stretch">
        <h2 className="text-lg font-semibold text-primary">
          AI Agent Chat
        </h2>
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