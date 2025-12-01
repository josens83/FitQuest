import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import * as Sentry from '@sentry/react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
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

    // Log error
    console.error(`ErrorBoundary [${this.props.name || 'unknown'}]:`, error, errorInfo);

    // Report to Sentry
    // Sentry.captureException(error, {
    //   extra: { componentStack: errorInfo.componentStack },
    //   tags: { boundary: this.props.name || 'unknown' },
    // });

    // Custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback onRetry={this.handleRetry} error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Minimal Error Fallback for inline components
export function MinimalErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.minimalContainer}>
      <Ionicons name="alert-circle" size={24} color="#EF4444" />
      <Text style={styles.minimalText}>오류가 발생했습니다</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.minimalRetry}>
          <Text style={styles.minimalRetryText}>다시 시도</Text>
        </Pressable>
      )}
    </View>
  );
}

// Full Screen Error Fallback
function ErrorFallback({
  onRetry,
  error,
}: {
  onRetry: () => void;
  error: Error | null;
}) {
  const isDev = __DEV__;

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={48} color="#EF4444" />
        </View>

        <Text style={styles.title}>문제가 발생했습니다</Text>
        <Text style={styles.description}>
          예상치 못한 오류가 발생했습니다.{'\n'}
          다시 시도해 주세요.
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable style={styles.primaryButton} onPress={onRetry}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>다시 시도</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {isDev && error && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorTitle}>Error Details (Dev Only)</Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
            <Text style={styles.errorStack}>{error.stack}</Text>
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}

// Screen-level Error Boundary HOC
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { name?: string; fallback?: ReactNode }
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary name={options?.name} fallback={options?.fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Async Error Boundary (for data fetching)
interface AsyncBoundaryProps {
  children: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
}

export function AsyncBoundary({ children, loading, error }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={error || <MinimalErrorFallback />}>
      <React.Suspense fallback={loading || <LoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>로딩 중...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  errorDetails: {
    marginTop: 24,
    maxHeight: 200,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
  },
  errorTitle: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#F87171',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#FECACA',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  minimalContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimalText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#94A3B8',
    marginTop: 8,
  },
  minimalRetry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
  },
  minimalRetryText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#6366F1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderTopColor: '#6366F1',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
});
