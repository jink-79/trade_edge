import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "@/components/ui/sonner";

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
      >
        {children}
        {/* top of the screen, so it never covers the bottom tab bar */}
        <Toaster
          position="top-center"
          offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
