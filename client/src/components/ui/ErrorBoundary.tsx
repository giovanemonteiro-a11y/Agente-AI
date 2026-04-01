import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 p-8">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                Algo deu errado
              </h2>
              <p className="text-sm text-white/50">
                Ocorreu um erro inesperado nesta seção.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs text-red-300 bg-red-950/30 rounded-lg p-3 overflow-auto max-h-32 border border-red-500/20">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReset}
              className="btn-gradient flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level ErrorBoundary — wraps a full page route.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-bg-deep">
          <div className="glass-card-strong p-10 max-w-md w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Página indisponível</h1>
            <p className="text-white/50">
              Esta página encontrou um erro crítico. Recarregue para tentar novamente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
