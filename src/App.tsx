// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardPage from "@/pages/DashboardPage";
import Auth from "@/pages/Auth";
import StudentRegistration from "@/pages/StudentRegistration";
import NotFound from "@/pages/NotFound";
import SelectInstitutPage from "@/pages/SelectInstitutPage";
import { getCurrentInstitutId } from "@/lib/institutes";
import "./App.css";

function AppRoutes() {
  // useLocation force un re-render à chaque navigation,
  // donc le garde d'institut est recalculé à jour
  useLocation();
  const hasInstitut = typeof window !== "undefined" && getCurrentInstitutId() !== null;

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Page de sélection d'institut (icones à la racine) */}
        <Route path="/select" element={<SelectInstitutPage />} />

        {/* Redirection par défaut : vers sélection si aucun institut, sinon dashboard */}
        <Route
          path="/"
          element={
            <Navigate
              to={hasInstitut ? "/dashboard" : "/select"}
              replace
            />
          }
        />

        {/* Dashboard + Tabs - protégé par sélection d'institut */}
        <Route
          path="/dashboard"
          element={
            hasInstitut ? <DashboardPage /> : <Navigate to="/select" replace />
          }
        />
        <Route
          path="/members"
          element={
            hasInstitut ? <DashboardPage /> : <Navigate to="/select" replace />
          }
        />
        <Route
          path="/attendance"
          element={
            hasInstitut ? <DashboardPage /> : <Navigate to="/select" replace />
          }
        />
        <Route
          path="/admin"
          element={
            hasInstitut ? <DashboardPage /> : <Navigate to="/select" replace />
          }
        />

        {/* Auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<StudentRegistration />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Router
          basename={import.meta.env.BASE_URL.replace(/\/$/, "")}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
        </Router>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
