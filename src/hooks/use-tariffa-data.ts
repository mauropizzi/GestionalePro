"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseISO } from "date-fns";

// Interfacce per i dati recuperati
interface Client {
  id: string;
  ragione_sociale: string;
}

interface PuntoServizio {
  id: string;
  nome_punto_servizio: string;
}

interface Fornitore {
  id: string;
  ragione_sociale: string;
}

interface Tariffa {
  id: string;
  client_id: string | null;
  tipo_servizio: string;
  importo: number;
  supplier_rate: number | null;
  unita_misura: string | null;
  punto_servizio_id: string | null;
  fornitore_id: string | null;
  data_inizio_validita: string | null;
  data_fine_validita: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface UseTariffaDataResult {
  tariffa: Tariffa | null;
  clients: Client[];
  puntiServizio: PuntoServizio[];
  fornitori: Fornitore[];
  isLoading: boolean;
  error: string | null;
}

export function useTariffaData(tariffaId?: string): UseTariffaDataResult {
  const [tariffa, setTariffa] = useState<Tariffa | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [puntiServizio, setPuntiServizio] = useState<PuntoServizio[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clienti")
          .select("id, ragione_sociale")
          .order("ragione_sociale", { ascending: true });

        if (clientsError) throw new Error("Errore nel recupero dei clienti: " + clientsError.message);
        setClients(clientsData || []);

        // Fetch punti servizio
        const { data: puntiServizioData, error: puntiServizioError } = await supabase
          .from("punti_servizio")
          .select("id, nome_punto_servizio")
          .order("nome_punto_servizio", { ascending: true });

        if (puntiServizioError) throw new Error("Errore nel recupero dei punti di servizio: " + puntiServizioError.message);
        setPuntiServizio(puntiServizioData || []);

        // Fetch fornitori
        const { data: fornitoriData, error: fornitoriError } = await supabase
          .from("fornitori")
          .select("id, ragione_sociale")
          .order("ragione_sociale", { ascending: true });

        if (fornitoriError) throw new Error("Errore nel recupero dei fornitori: " + fornitoriError.message);
        setFornitori(fornitoriData || []);

        // Fetch tariffa data if tariffaId is provided
        if (tariffaId) {
          const { data: tariffaData, error: tariffaError } = await supabase
            .from("tariffe")
            .select("*")
            .eq("id", tariffaId)
            .single();

          if (tariffaError) throw new Error("Errore nel recupero della tariffa: " + tariffaError.message);
          setTariffa(tariffaData);
        }
      } catch (err: any) {
        toast.error(err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [tariffaId]);

  return { tariffa, clients, puntiServizio, fornitori, isLoading, error };
}