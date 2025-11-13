import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import WorkingIndex from '@/pages/WorkingIndex';
import Auth from '@/pages/Auth';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<WorkingIndex />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;