'use client';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <AlertTriangle className="w-16 h-16 text-amber-400/60" />
      <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
      <p className="text-sm text-zinc-500 max-w-sm">
        An unexpected error occurred. Please try again later.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="btn-accent mt-4"
      >
        Try Again
      </button>
    </div>
  );
}