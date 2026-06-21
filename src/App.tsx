// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import DashboardPage from "@/pages/DashboardPage";
import Auth from "@/pages/Auth";
import StudentRegistration from "@/pages/StudentRegistration";
import NotFound from "@/pages/NotFound";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Redirection par défaut */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard + Tabs */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/members" element={<DashboardPage />} />
              <Route path="/attendance" element={<DashboardPage />} />
              <Route path="/admin" element={<DashboardPage />} />

              {/* Auth */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/register" element={<StudentRegistration />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster />
          </div>
        </Router>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;