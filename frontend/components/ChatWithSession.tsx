"use client"

import { useMemo } from 'react'
import { TokenSource } from 'livekit-client'
import { useSession } from '@livekit/components-react'
import { APP_CONFIG_DEFAULTS } from '@/app-config'
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider'
import AgentChatUI from '@/components/AgentChatUI'

export default function ChatWithSession() {
  const tokenSource = useMemo(() => {
    return TokenSource.endpoint('/api/connection-details')
  }, [])

  const session = useSession(
    tokenSource,
    APP_CONFIG_DEFAULTS.agentName ? { agentName: APP_CONFIG_DEFAULTS.agentName } : undefined
  )

  return (
    <AgentSessionProvider session={session}>
      <div className="w-1/4 min-w-[300px] bg-card border-r border-border h-screen">
        <AgentChatUI />
      </div>
    </AgentSessionProvider>
  )
}
