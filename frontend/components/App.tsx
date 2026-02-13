import React from 'react'
import AgentChatUI from './AgentChatUI'
import ThemeSwitcher from './ThemeSwitcher'
import { WebsiteContainer } from './WebsiteContainer'

const App = () => {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Side - Agent Chat UI (1/4 width) */}
      <div className="w-1/4 min-w-[300px] bg-card border-r border-border">
        <AgentChatUI />
      </div>

      {/* Right Side - Placeholder for future content (3/4 width) */}
      <div className="flex-1 p-4">
        <WebsiteContainer />
      </div>
    
    </div>
  )
}

export default App