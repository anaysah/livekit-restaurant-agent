import React from 'react'
import Header from '@/components/website/header'

export default function layout({children}:{children:React.ReactNode}) {
  return (
    // <div className="">
    <div className="flex-1 h-screen overflow-y-auto bg-background pb-24">
        <Header />
      {children}

    </div>
    
  )
}
