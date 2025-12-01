'use client';

import React, { Suspense, ReactNode, Component, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary for async components
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error }: { error: Error | null }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">로딩 실패</h3>
      <p className="text-slate-400 text-sm mb-4">콘텐츠를 불러오는 중 오류가 발생했습니다.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
      >
        새로고침
      </button>
    </div>
  );
}

// Default loading fallback component
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">로딩 중...</p>
      </div>
    </div>
  );
}

// Skeleton loader components
export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-slate-700 rounded-lg h-48 mb-4" />
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-700 rounded w-1/2" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-24 h-24 bg-slate-700 rounded-full mx-auto mb-4" />
      <div className="h-6 bg-slate-700 rounded w-32 mx-auto mb-2" />
      <div className="h-4 bg-slate-700 rounded w-24 mx-auto" />
    </div>
  );
}

// Props for AsyncBoundary
interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Combined Suspense + Error Boundary for async components
 * Usage:
 * <AsyncBoundary loadingFallback={<Skeleton />}>
 *   <AsyncComponent />
 * </AsyncBoundary>
 */
export function AsyncBoundary({
  children,
  loadingFallback = <DefaultLoadingFallback />,
  errorFallback,
  onError,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

/**
 * Query boundary for data fetching components
 */
export function QueryBoundary({
  children,
  skeleton,
}: {
  children: ReactNode;
  skeleton?: ReactNode;
}) {
  return (
    <AsyncBoundary
      loadingFallback={skeleton || <ListSkeleton />}
      errorFallback={
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">데이터를 불러오지 못했습니다</p>
          <button
            onClick={() => window.location.reload()}
            className="text-indigo-400 hover:text-indigo-300"
          >
            다시 시도
          </button>
        </div>
      }
    >
      {children}
    </AsyncBoundary>
  );
}
