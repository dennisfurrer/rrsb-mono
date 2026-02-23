"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
