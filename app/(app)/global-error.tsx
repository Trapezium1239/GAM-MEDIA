'use client';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-zinc-400">
            An unexpected error occurred. Your data is safe.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 font-mono">Ref: {error.digest}</p>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={reset}
              className="btn-primary"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="btn-secondary"
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}