import React from "react";

type ErrorBoundaryState = {
  error?: Error;
  componentStack?: string;
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI crashed:", error, info);
    this.setState({ componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto px-4 py-16">
            <div className="rounded-2xl border bg-card p-8">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Render Error
              </p>
              <h1 className="mt-3 font-heading text-2xl font-bold uppercase">
                Something broke
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Open the browser console to see the error details.
              </p>
              <pre className="mt-4 whitespace-pre-wrap rounded-lg border bg-background/60 p-4 text-xs text-muted-foreground">
                {this.state.error.message}
              </pre>
              {this.state.componentStack ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-lg border bg-background/60 p-4 text-xs text-muted-foreground">
                  {this.state.componentStack}
                </pre>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
