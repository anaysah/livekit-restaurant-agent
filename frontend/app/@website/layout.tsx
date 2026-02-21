import React from 'react'
import Header from '@/components/website/header'

export default function layout({children}:{children:React.ReactNode}) {
  return (
    <div className="flex-1 h-screen overflow-y-auto" style={{ background: "var(--color-background)" }}>
      <Header />
      {children}
    </div>
  )
}

