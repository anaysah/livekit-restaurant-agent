import React from 'react'
import Header from '@/components/website/header'
import DoodleBackground from '@/components/website/DoodleBackground'

export default function layout({children}:{children:React.ReactNode}) {
  return (
    <div
      className="flex-1 h-screen overflow-y-auto"
      style={{ background: "var(--color-background)" }}
    >
      {/*
        Header is a direct child of the scroll container with no overflow ancestor
        between them — this is the only way position:sticky works correctly.
      */}
      <Header />

      {/*
        Content wrapper: position:relative so DoodleBackground (absolute, height:100%)
        fills exactly the content height. No overflow set here — DoodleBackground
        handles its own clipping internally via overflow:hidden.
      */}
      <div className="relative">
        <DoodleBackground />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  )
}

