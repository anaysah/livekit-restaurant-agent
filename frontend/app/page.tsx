// app/page.tsx
"use client";

import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import ThemeSwitcher from "@/components/ThemeSwitcher";
import AgentChatUI from "@/components/AgentChatUI";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { APP_CONFIG_DEFAULTS } from '@/app-config';
import App from '@/components/App';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';

export default function Home() {

  const tokenSource = useMemo(() => {
    return TokenSource.endpoint('/api/connection-details');
  }, []);

  // console.log('tokenSource', tokenSource);

  const session = useSession(
    tokenSource,
    APP_CONFIG_DEFAULTS.agentName ? { agentName: APP_CONFIG_DEFAULTS.agentName } : undefined
  );

  return (
    <AgentSessionProvider session={session}>
    <App/>
    </AgentSessionProvider>
  );
}
