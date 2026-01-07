import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Outbound Internal Tool",
  description: "SOC5 outbound operations dashboard and dispatch tooling.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen overflow-hidden bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
