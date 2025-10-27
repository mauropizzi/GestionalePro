"use client";

import React from "react"; // Importa React

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">Ciao Mondo!</h1>
      <p className="text-lg text-muted-foreground">Se vedi questo, la pagina principale funziona.</p>
    </div>
  );
}