import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

class RootErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Root render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: 24,
        }}>
          <div style={{ maxWidth: 760, width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: 20 }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Application crashed during render</h1>
            <p style={{ margin: '0 0 12px 0', opacity: 0.9 }}>
              Open DevTools console to see the full stack trace.
            </p>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', opacity: 0.95 }}>
              {this.state.errorMessage || 'Unknown React render error'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
