"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./session-context-provider";

// Profile hooks
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Open alarms hook
export function useOpenAlarms() {
  return useQuery({
    queryKey: ["open-alarms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allarme_entries")
        .select(`
          *,
          punti_servizio(nome_punto_servizio),
          pattuglia:personale!gpg_personale_id(nome, cognome, telefono)
        `)
        .is("service_outcome", null)
        .order("registration_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 1000 * 60, // Refetch every minute
    staleTime: 1000 * 30, // Consider stale after 30 seconds
  });
}

// Personnel hook
export function usePersonale() {
  return useQuery({
    queryKey: ["personale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("personale")
        .select("*")
        .eq("attivo", true)
        .order("cognome", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Network operators hook
export function useNetworkOperators() {
  return useQuery({
    queryKey: ["operatori-network"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operatori_network")
        .select("*")
        .order("cognome", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Service points hook
export function usePuntiServizio() {
  return useQuery({
    queryKey: ["punti-servizio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("punti_servizio")
        .select("*")
        .eq("attivo", true)
        .order("nome_punto_servizio", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Update alarm mutation
export function useUpdateAlarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("allarme_entries")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-alarms"] });
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
    },
  });
}

// Generic table fetch hook
export function useTableFetch<T>(tableName: string, select: string = "*") {
  return useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(select);
      if (error) throw error;
      return data as T[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}