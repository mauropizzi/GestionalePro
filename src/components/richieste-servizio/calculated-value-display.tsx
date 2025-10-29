"use client";

import React from "react";

interface CalculatedValueDisplayProps {
  calculatedValue: number | null;
  calculationLabel: string;
}

export function CalculatedValueDisplay({ calculatedValue, calculationLabel }: CalculatedValueDisplayProps) {
  if (calculatedValue === null) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
      <span className="font-medium">{calculationLabel}</span>
      <span className="text-lg font-bold text-primary">{calculatedValue}</span>
    </div>
  );
}