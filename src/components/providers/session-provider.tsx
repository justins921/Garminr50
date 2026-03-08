"use client";

// Auth disabled — just pass children through
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
