"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Procedura {
  id: string;
  nome_procedura: string;
  descrizione: string | null;
  versione: string | null;
  data_ultima_revisione: string | null; // ISO string for date
  responsabile: string | null;
  documento_url: string | null;
  attivo: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const formSchema = z.object({
  nome_procedura: z.string().min(1, "Il nome della procedura è richiesto."),
  descrizione: z.string().nullable(),
  versione: z.string().nullable(),
  data_ultima_revisione: z.date().nullable(),
  responsabile: z.string().nullable(),
  documento_url: z.string().url("Inserisci un URL valido.").nullable().or(z.literal("")),
  attivo: z.boolean(),
  note: z.string().nullable(),
});

type ProceduraFormSchema = z.infer<typeof formSchema>;

export default function EditProceduraPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [procedura, setProcedura] = useState<Procedura | null>(null);
  const router = useRouter();
  const params = useParams();
  const proceduraId = params.id as string;

  const form = useForm<ProceduraFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_procedura: "",
      descrizione: null,
      versione: null,
      data_ultima_revisione: null,
      responsabile: null,
      documento_url: null,
      attivo: true,
      note: null,
    },
  });

  useEffect(() => {
    async function fetchProceduraData() {
      if (!proceduraId) return;

      const { data, error } = await supabase
        .from("procedure")
        .select("*")
        .eq("id", proceduraId)
        .single();

      if (error) {
        toast.error("Errore nel recupero della procedura: " + error.message);
        router.push("/anagrafiche/procedure");
      } else if (data) {
        setProcedura(data);
        form.reset({
          nome_procedura: data.nome_procedura || "",
          descrizione: data.descrizione || null,
          versione: data.versione || null,
          data_ultima_revisione: data.data_ultima_revisione ? parseISO(data.data_ultima_revisione) : null,
          responsabile: data.responsabile || null,
          documento_url: data.documento_url || null,
          attivo:<dyad-problem-report summary="1 problems">
<problem file="src/components/password-reset-link-toast.tsx" line="25" column="31" code="2322">Type '&quot;xs&quot;' is not assignable to type '&quot;default&quot; | &quot;sm&quot; | &quot;lg&quot; | &quot;icon&quot; | null | undefined'.</problem>
</dyad-problem-report><think>**Fixing the Button Bug**

I've been wrestling with a pesky TypeScript error in `password-reset-link-toast.tsx`. The `size="xs"` on the `Button` component is throwing a fit. Looks like I need to revisit the `Button`'s prop definitions, since "xs" isn't a recognized size. I'm going to have to make the button size bigger.


**Updating Button Size**

I've pinpointed the issue in `password-reset-link-toast.tsx`. The problem stemmed from using an unsupported button size, "xs".  Reviewing the Shadcn/UI Button component's prop definitions, I realized "xs" isn't a valid size option. My solution is straightforward: I'll replace `"xs"` with `"sm"` to align with the component's accepted values. This should resolve the TypeScript error.


</think>Ho corretto l'errore di compilazione TypeScript modificando la proprietà `size` del componente `Button` da `"xs"` a `"sm"` in `src/components/password-reset-link-toast.tsx`, poiché `"xs"` non è un valore valido per la dimensione del pulsante.

<dyad-write path="src/components/password-reset-link-toast.tsx" description="Fixing TypeScript error by adjusting button size.">
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