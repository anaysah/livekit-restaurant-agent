import React from 'react'
import Header from '@/components/website/header'
import DoodleBackground from '@/components/website/DoodleBackground'

export default function layout({children}:{children:React.ReactNode}) {
  return (
    <div
      className="flex-1 h-screen overflow-y-auto"
      style={{ background: "var(--color-background)" }}
    >
      {/* relative here grows to full content height — DoodleBackground's 100% covers the whole page */}
      <div className="relative overflow-x-hidden">
        <DoodleBackground />
        <div className="relative z-10">
          <Header />
          {children}
        </div>
      </div>
    </div>
  )
}

