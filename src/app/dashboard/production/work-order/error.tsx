"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Work Order Page Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong loading Work Orders!</h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          We encountered an unexpected error while loading the work orders data. Please try again or go back to the dashboard.
        </p>
        
        {error?.message && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-100 w-full max-w-2xl overflow-auto text-left">
            <p className="text-sm font-mono text-red-600 whitespace-pre-wrap break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-sm"
          >
            Try again
          </button>
          <Link 
            href="/dashboard"
            className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
