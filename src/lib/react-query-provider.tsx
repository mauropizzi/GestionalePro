"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60, // 1 minute
            gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 401/403 errors
              if (error && typeof error === "object" && "status" in error) {
                const status = (error as any).status;
                if (status === 401 || status === 403 || status === 404) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false, // Disable automatic refetch on window focus to prevent unnecessary requests
            refetchOnReconnect: true, // Refetch on reconnect is good for data consistency
          },
          mutations: {
            retry: 1, // Retry mutations once
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}