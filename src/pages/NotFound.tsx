// src/pages/NotFound.tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-slate-200 shadow-xl">
        <CardContent className="pt-6 text-center">
          <div className="text-amber-500 mb-4">
            <AlertTriangle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            404 - Page non trouvée
          </h1>
          <p className="text-slate-600 mb-6">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Retour au tableau de bord
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Page précédente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}