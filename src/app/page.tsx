"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import DashboardLayout from "@/components/dashboard-layout";
import { useSession } from "@/components/session-context-provider";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function Home() {
  return (
    <DashboardLayout>
      <div
        className="flex flex-col items-center justify-center h-full text-center p-6 bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/dashboard-background.png')" }}
      >
        <div className="bg-black/60 p-12 rounded-lg max-w-4xl space-y-6">
          <div className="flex items-center justify-center mb-6">
            <Lock className="h-20 w-20 text-blue-accent mr-6" />
            <h1 className="text-7xl font-bold text-white">LUMAFIN</h1>
          </div>
          <h2 className="text-4xl font-semibold mb-6">
            Non un semplice gestionale, ma il tuo partner strategico completo
          </h2>
          <ul className="text-xl text-left space-y-3">
            <li className="flex items-center">
              <span className="mr-3 text-blue-accent">✓</span> Software personalizzato per esigenze specifiche
            </li>
            <li className="flex items-center">
              <span className="mr-3 text-blue-accent">✓</span> Consulenza commerciale dedicata
            </li>
            <li className="flex items-center">
              <span className="mr-3 text-blue-accent">✓</span> Assistenza continua e tempestiva
            </li>
            <li className="flex items-center">
              <span className="mr-3 text-blue-accent">✓</span> Supporto di Senior Security Manager esperti
            </li>
            <li className="flex items-center">
              <span className="mr-3 text-blue-accent">✓</span> Preparazione offerte su misura competitive
            </li>
            <li className="flex items-center">
              <span className="mr-3 text-blue-accent">✓</span> Progettazione avanzata per partecipazione a Gare
            </li>
          </ul>
        </div>
      </div>
      <MadeWithDyad />
    </DashboardLayout>
  );
}