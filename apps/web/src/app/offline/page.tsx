'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 mb-6">
            <WifiOff className="w-12 h-12 text-slate-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            You&apos;re Offline
          </h1>
          <p className="text-slate-400 text-lg">
            It looks like you&apos;ve lost your internet connection.
            Don&apos;t worry, your workout data is saved locally.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h2 className="text-white font-semibold mb-2">While offline, you can:</h2>
            <ul className="text-slate-400 text-sm space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>View your cached workout history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Review saved workout plans</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Check your achievements and progress</span>
              </li>
            </ul>
          </div>

          <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
            <p className="text-indigo-300 text-sm">
              Your pending workout data will automatically sync when you&apos;re back online.
            </p>
          </div>
        </div>

        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>

        <p className="mt-6 text-slate-500 text-sm">
          Check your Wi-Fi or mobile data connection
        </p>
      </div>
    </div>
  );
}
