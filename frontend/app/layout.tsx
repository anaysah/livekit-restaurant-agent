// app/layout.tsx
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider 
          attribute="data-theme"
          defaultTheme="dark"
          // enableSystem={true}
          themes={['light', 'dark', 'neon', 'pink']}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}