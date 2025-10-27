import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="it">
      <body>
        {children}
      </body>
    </html>
  );
}