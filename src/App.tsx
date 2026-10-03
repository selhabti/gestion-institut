// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardPage from "@/pages/DashboardPage";
import Auth from "@/pages/Auth";
import StudentRegistration from "@/pages/StudentRegistration";
import StaffRegistration from "@/pages/StaffRegistration";
import NotFound from "@/pages/NotFound";
import SelectInstitutPage from "@/pages/SelectInstitutPage";
import {
  getCurrentInstitutId,
  getInstitutList,
  setCurrentInstitut,
  type InstitutId,
} from "@/lib/institutes";
import "./App.css";

// Compatibilité : ?institut=attanzil sur l'URL de base
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("institut");
  if (id && getInstitutList().some((c) => c.id === id)) {
    setCurrentInstitut(id as InstitutId);
  }
}

// Vérifie que le segment d'institut de l'URL est valide, sinon renvoie au choix
function RequireInstitut({ children }: { children: React.ReactNode }) {
  const { institutId } = useParams();
  const enabled = getInstitutList();
  if (!institutId || !enabled.some((c) => c.id === institutId)) {
    return <Navigate to="/select" replace />;
  }
  return <>{children}</>;
}

// Redirige les anciens chemins (/dashboard) vers le chemin préfixé (/attanzil/dashboard)
function InstitutRedirect({ tab }: { tab: string }) {
  const id = getCurrentInstitutId();
  return <Navigate to={id ? `/${id}/${tab}` : "/select"} replace />;
}

// Remonte DashboardPage quand on change d'institut (évite de garder les données du précédent)
function InstitutDashboard() {
  const { institutId } = useParams();
  return <DashboardPage key={institutId} />;
}

function AppRoutes() {
  // useLocation force un re-render à chaque navigation
  useLocation();
  const hasInstitut =
    typeof window !== "undefined" && getCurrentInstitutId() !== null;

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Choix de l'institut (global) */}
        <Route path="/select" element={<SelectInstitutPage />} />

        {/* Racine : dashboard de l'institut (URL-aware) sinon choix */}
        <Route
          path="/"
          element={
            <Navigate
              to={hasInstitut ? `/${getCurrentInstitutId()}/dashboard` : "/select"}
              replace
            />
          }
        />

        {/* App préfixée par l'institut dans l'URL */}
        <Route
          path="/:institutId/dashboard"
          element={
            <RequireInstitut>
              <InstitutDashboard />
            </RequireInstitut>
          }
        />
        <Route
          path="/:institutId/members"
          element={
            <RequireInstitut>
              <InstitutDashboard />
            </RequireInstitut>
          }
        />
        <Route
          path="/:institutId/attendance"
          element={
            <RequireInstitut>
              <InstitutDashboard />
            </RequireInstitut>
          }
        />
        <Route
          path="/:institutId/admin"
          element={
            <RequireInstitut>
              <InstitutDashboard />
            </RequireInstitut>
          }
        />
        <Route path="/:institutId/select" element={<SelectInstitutPage />} />

        {/* Anciens chemins -> redirection vers le chemin préfixé */}
        <Route path="/dashboard" element={<InstitutRedirect tab="dashboard" />} />
        <Route path="/members" element={<InstitutRedirect tab="members" />} />
        <Route
          path="/attendance"
          element={<InstitutRedirect tab="attendance" />}
        />
        <Route path="/admin" element={<InstitutRedirect tab="admin" />} />

        {/* Auth */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<StudentRegistration />} />
        <Route path="/staff" element={<StaffRegistration />} />

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
