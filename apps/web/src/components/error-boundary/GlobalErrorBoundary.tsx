'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@fitquest/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to error tracking service (Sentry)
    console.error('GlobalErrorBoundary caught an error:', error, errorInfo);

    // In production, send to Sentry
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, {
      //   extra: { componentStack: errorInfo.componentStack },
      //   tags: { boundary: 'global' },
      // });
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                문제가 발생했습니다
              </h1>
              <p className="text-slate-400 mb-6">
                예상치 못한 오류가 발생했습니다. 다시 시도하거나 페이지를 새로고침해 주세요.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                다시 시도
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                페이지 새로고침
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left bg-slate-800 rounded-lg p-4 overflow-auto max-h-60">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.message}
                </p>
                <pre className="text-slate-500 font-mono text-xs whitespace-pre-wrap">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
