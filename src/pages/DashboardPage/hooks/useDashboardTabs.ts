import { useState, useCallback } from "react";

export type DashboardTab = "dashboard" | "members" | "attendance" | "admin";

export const useDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

  const handleTabChange = useCallback((value: string) => {
    // Type assertion sécurisée
    if (value === "dashboard" || value === "members" || 
        value === "attendance" || value === "admin") {
      setActiveTab(value as DashboardTab);
    }
  }, []);

  return {
    activeTab,
    handleTabChange,
  };
};