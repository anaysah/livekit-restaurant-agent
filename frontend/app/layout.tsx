// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Restaurant AI Assistant",
  description: "An AI-powered assistant for restaurant management and customer service.",
};


const inter = Inter({ subsets: ["latin"] });



export default function RootLayout({
  children,
  chat,
  website,
}: {
  children: React.ReactNode;
  chat: React.ReactNode;
  website: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className="bg-background text-foreground" style={inter.style}>
        <ThemeProvider 
          attribute="data-theme"
          defaultTheme="dark"
          // enableSystem={true}
          themes={['light', 'dark', 'neon', 'pink']}
        >
          <div className="flex h-screen bg-background text-foreground">
            {/* Left Side - Chat UI (Parallel Slot) */}
            {chat}
            
            {/* Right Side - Website Content (Parallel Slot) */}
            {website}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}