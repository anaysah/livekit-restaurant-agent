import React from 'react'
import AgentChatUI from './AgentChatUI'
import ThemeSwitcher from './ThemeSwitcher'

const App = () => {
  return (
    <div className="flex h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Left Side - Agent Chat UI (1/4 width) */}
      <div className="w-1/4 min-w-[300px] bg-[var(--color-card)] border-r border-[var(--color-border)]">
        <AgentChatUI />
      </div>

      {/* Right Side - Main Content (3/4 width) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        {/* <Navbar /> */}
        <div className="bg-[var(--color-background-light)] border-b border-[var(--color-border)] p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[var(--color-primary)]">Restaurant Booking</h1>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Sample Card to demonstrate theme variables */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-[var(--color-primary)]">Booking Form</h2>
              <p className="text-[var(--color-text-muted)] text-base">Form will appear here</p>
            </div>

            <div className="bg-[var(--color-card)] border border-[var(--color-border-light)] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2 text-[var(--color-secondary)]">Seating Preference</h2>
              <p className="text-[var(--color-text-muted)] text-base">Seating options will appear here</p>
            </div>

            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">Restaurant Menu</h2>
              <p className="text-[var(--color-text-muted)] text-sm">Menu items will appear here</p>
            </div>
            
            {/* Booking Form Section */}
            {/* <BookingForm /> */}

            {/* Seating Preference Section */}
            {/* <SeatingPreference /> */}

            {/* Restaurant Menu Section */}
            {/* <MenuSection /> */}
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal - Conditionally shown */}
      {/* {showConfirmation && <BookingConfirmation />} */}
    </div>
  )
}

export default App