import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { THEME_SCRIPT } from "@/components/theme";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: { default: "Interview Prep", template: "%s · Interview Prep" },
  description: "A personal, Notion-style workspace for Frontend, Full Stack and AI Engineering interview preparation.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#191919" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="h-dvh overflow-hidden antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
