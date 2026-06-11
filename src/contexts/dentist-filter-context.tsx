"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type SelectedDentistId = string | "all";

type DentistFilterContextValue = {
  selectedDentistId: SelectedDentistId;
  setSelectedDentistId: (id: SelectedDentistId) => void;
};

const DentistFilterContext = createContext<DentistFilterContextValue | null>(
  null,
);

export function DentistFilterProvider({ children }: { children: ReactNode }) {
  const [selectedDentistId, setSelectedDentistId] =
    useState<SelectedDentistId>("all");

  return (
    <DentistFilterContext.Provider
      value={{ selectedDentistId, setSelectedDentistId }}
    >
      {children}
    </DentistFilterContext.Provider>
  );
}

export function useDentistFilter() {
  const context = useContext(DentistFilterContext);
  if (!context) {
    throw new Error(
      "useDentistFilter must be used within DentistFilterProvider",
    );
  }
  return context;
}
