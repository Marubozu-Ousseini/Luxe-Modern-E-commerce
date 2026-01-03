import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: Error; info?: { componentStack: string } };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-800 p-6">
          <div className="max-w-lg w-full">
            <h1 className="text-xl font-semibold mb-2">Une erreur est survenue</h1>
            <p className="text-sm mb-4">Veuillez actualiser la page. Si le problème persiste, contactez l'administrateur.</p>
            {this.state.error && (
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                {String(this.state.error.message || this.state.error)}
              </pre>
            )}
            {this.state.info?.componentStack && (
              <details className="mt-3">
                <summary className="text-xs cursor-pointer">Détails techniques</summary>
                <pre className="text-[11px] bg-gray-100 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                  {this.state.info.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
