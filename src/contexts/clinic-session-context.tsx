"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AuthContext } from "@/lib/auth/context";

type ClinicSessionContextValue = Pick<
  AuthContext,
  "profile" | "clinic" | "enabledModules" | "dentists"
>;

const ClinicSessionContext = createContext<ClinicSessionContextValue | null>(
  null,
);

export function ClinicSessionProvider({
  value,
  children,
}: {
  value: ClinicSessionContextValue;
  children: ReactNode;
}) {
  return (
    <ClinicSessionContext.Provider value={value}>
      {children}
    </ClinicSessionContext.Provider>
  );
}

export function useClinicSession() {
  const ctx = useContext(ClinicSessionContext);
  if (!ctx) {
    throw new Error("useClinicSession must be used within ClinicSessionProvider");
  }
  return ctx;
}
