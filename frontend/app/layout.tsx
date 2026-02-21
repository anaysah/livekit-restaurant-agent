// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Playfair_Display, DM_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "Restaurant AI Assistant",
  description: "An AI-powered assistant for restaurant management and customer service.",
};


const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
});



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

      <body className={`bg-background text-foreground ${dmSans.variable} ${playfair.variable}`} style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', ui-sans-serif, sans-serif)" }}>
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