import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionContextProvider } from "@/components/session-context-provider";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LUMAFIN - Gestionale",
  description: "Software gestionale per servizi di sicurezza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <ReactQueryProvider>
          <SessionContextProvider>
            {children}
            <Toaster richColors position="top-center" />
          </SessionContextProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}