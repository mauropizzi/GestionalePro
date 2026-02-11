import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlarmEntry, HistoricalSearchFilters } from "@/types/centrale-operativa";
import { PuntoServizio } from "@/types/richieste-servizio";
import { Personale, NetworkOperator } from "@/types/anagrafiche";
import { format } from "date-fns";

export function useCentraleOperativaData() {
  const [currentAlarm, setCurrentAlarm] = useState<AlarmEntry | null>(null);
  const [historicalAlarms, setHistoricalAlarms] = useState<AlarmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [personaleOptions, setPersonaleOptions] = useState<Personale[]>([]);
  const [networkOperatorsOptions, setNetworkOperatorsOptions] = useState<NetworkOperator[]>([]);
  const [puntoServizioOptions, setPuntoServizioOptions] = useState<PuntoServizio[]>([]);

  const fetchDependencies = useCallback(async () => {
    try {
      // Use Promise.all to fetch in parallel
      const [personaleResult, networkResult, psResult] = await Promise.all([
        supabase
          .from("personale")
          .select("*")
          .eq("attivo", true)
          .order("cognome", { ascending: true }),
        supabase
          .from("operatori_network")
          .select("*")
          .order("cognome", { ascending: true }),
        supabase
          .from("punti_servizio")
          .select("*")
          .order("nome_punto_servizio", { ascending: true })
      ]);

      if (personaleResult.error) {
        toast.error("Errore nel recupero del personale: " + personaleResult.error.message);
      } else {
        setPersonaleOptions(personaleResult.data || []);
      }

      if (networkResult.error) {
        toast.error("Errore nel recupero degli operatori network: " + networkResult.error.message);
      } else {
        setNetworkOperatorsOptions(networkResult.data || []);
      }

      if (psResult.error) {
        toast.error("Errore nel recupero dei punti servizio: " + psResult.error.message);
      } else {
        setPuntoServizioOptions(psResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      toast.error("Errore nel caricamento dei dati di base");
    }
  }, []);

  const fetchCurrentAlarms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("allarme_entries")
        .select(`
          *,
          punti_servizio(nome_punto_servizio),
          personale(nome, cognome),
          operatori_network(nome, cognome)
        `)
        .is("service_outcome", null)
        .order("registration_date", { ascending: false })
        .limit(10);

      if (error) {
        toast.error("Errore nel recupero degli allarmi attivi: " + error.message);
      } else {
        setCurrentAlarm(data?.[0] || null);
      }
    } catch (error) {
      console.error("Error fetching current alarms:", error);
      toast.error("Errore nel recupero degli allarmi attivi");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistoricalAlarms = useCallback(async (filters?: HistoricalSearchFilters) => {
    setLoading(true);
    try {
      let query = supabase
        .from("allarme_entries")
        .select(`
          *,
          punti_servizio(nome_punto_servizio),
          personale(nome, cognome),
          operatori_network(nome, cognome)
        `)
        .not("service_outcome", "is", null)
        .order("registration_date", { ascending: false });

      if (filters?.from_date) {
        query = query.gte("registration_date", format(filters.from_date, "yyyy-MM-dd"));
      }
      if (filters?.to_date) {
        query = query.lte("registration_date", format(filters.to_date, "yyyy-MM-dd"));
      }
      if (filters?.punto_servizio_id) {
        query = query.eq("punto_servizio_id", filters.punto_servizio_id);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        toast.error("Errore nel recupero dello storico allarmi: " + error.message);
      } else {
        setHistoricalAlarms(data || []);
      }
    } catch (error) {
      console.error("Error fetching historical alarms:", error);
      toast.error("Errore nel recupero dello storico allarmi");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    currentAlarm,
    historicalAlarms,
    loading,
    personaleOptions,
    networkOperatorsOptions,
    puntoServizioOptions,
    fetchDependencies,
    fetchCurrentAlarms,
    fetchHistoricalAlarms,
  };
}