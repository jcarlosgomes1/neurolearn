'use client';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Algo correu mal', message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-rose-100 text-rose-600 mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-rose-900 mb-1">{title}</h3>
      {message && <p className="text-sm text-rose-700 max-w-md mx-auto">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      )}
    </div>
  );
}
