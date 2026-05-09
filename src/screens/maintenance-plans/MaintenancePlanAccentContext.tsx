import React, { createContext, useContext } from "react";
import { useTheme } from "../../context/ThemeContext";

const MaintenancePlanAccentContext = createContext<string | undefined>(
  undefined
);

/** When set (during plan questionnaire / picker), themed CTAs use this hex instead of theme primary. */
export function MaintenancePlanAccentProvider({
  accentHex,
  children,
}: {
  accentHex?: string;
  children: React.ReactNode;
}) {
  return (
    <MaintenancePlanAccentContext.Provider value={accentHex}>
      {children}
    </MaintenancePlanAccentContext.Provider>
  );
}

export function useMaintenancePlanAccent(): string {
  const accent = useContext(MaintenancePlanAccentContext);
  const { colors } = useTheme();
  return accent ?? colors.primary;
}
