import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { ThemeProvider } from "next-themes";

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="trade-edge-theme">
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
