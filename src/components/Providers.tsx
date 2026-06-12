"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import CommandPalette from "./CommandPalette";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Setup the QueryClient client instance as client-side state
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute cache lifetime
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Load global Raycast Cmd+K shortcut listener at app root */}
      <CommandPalette />
    </QueryClientProvider>
  );
}
