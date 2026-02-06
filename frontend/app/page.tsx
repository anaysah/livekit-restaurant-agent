// app/page.tsx
"use client";

import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function Home() {

  return (
    <div className="flex h-screen">
      {/* Left Side - Agent Chat UI (1/4 width) */}
      <div className="w-1/4 min-w-[300px] ">
        {/* <AgentChatUI /> */}
        
      </div>

      {/* Right Side - Main Content (3/4 width) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        {/* <Navbar /> */}

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
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
  );
}
