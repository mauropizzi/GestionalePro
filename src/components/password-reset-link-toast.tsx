"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordResetLinkToastProps {
  actionLink: string;
  toastId: string | number;
}

export function PasswordResetLinkToast({ actionLink, toastId }: PasswordResetLinkToastProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(actionLink);
    toast.success("Link copiato negli appunti!", { id: toastId });
  };

  return (
    <div className="flex flex-col gap-1 w-full max-w-md">
      <p className="text-xs font-medium">Link per il reset della password generato:</p>
      <div className="flex w-full items-center space-x-1">
        <Input type="text" value={actionLink} readOnly className="flex-1 text-xs" />
        <Button type="button" size="sm" onClick={handleCopy}>
          <Copy className="h-3 w-3 mr-1" /> Copia
        </Button>
      </div>
      <p className="text-2xs text-muted-foreground">
        Fornisci questo link all'utente per consentirgli di reimpostare la propria password.
      </p>
    </div>
  );
}