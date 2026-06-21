// Path: src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("💥 Erreur React capturée:", error);
    console.error("📋 Stack trace:", errorInfo.componentStack);

    // Envoyer l'erreur à un service de monitoring (facultatif)
    if (process.env.NODE_ENV === "production") {
      // Exemple: envoyer à Sentry, LogRocket, etc.
      // logErrorToService(error, errorInfo);
    }

    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, l'utiliser
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-red-200 shadow-xl">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-red-500">
                <AlertCircle className="h-16 w-16 mx-auto" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Oups ! Quelque chose s'est mal passé
                </h2>
                <p className="text-slate-600 text-sm mb-4">
                  L'application a rencontré une erreur inattendue.
                </p>

                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left">
                    <p className="text-sm font-medium text-slate-900 mb-1">
                      Détails de l'erreur (développement) :
                    </p>
                    <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-slate-600 mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réessayer
                </Button>

                <Button
                  onClick={this.handleReload}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Recharger la page
                </Button>
              </div>

              <p className="text-xs text-slate-500 pt-4 border-t border-slate-200">
                Si le problème persiste, contactez le support technique.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Version simplifiée pour les sections
export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <p className="text-slate-700">Erreur dans cette section</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-3"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
};
