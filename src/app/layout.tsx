import type { Metadata } from "next";
import "./globals.css";
import { SessionContextProvider } from "@/components/session-context-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes"; // Import ThemeProvider

export const metadata: Metadata = {
  title: "Gestione Accessi App",
  description: "Applicazione per la gestione degli accessi con ruoli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`font-sans antialiased min-h-screen`} // Aggiunta min-h-screen
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionContextProvider>
            {children}
          </SessionContextProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}