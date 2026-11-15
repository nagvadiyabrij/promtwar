import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 mb-2">
          <HeartHandshake className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display font-black text-6xl text-teal-600">404</h1>
          <h2 className="font-bold text-2xl text-slate-900">Page Not Found</h2>
          <p className="text-sm text-slate-500">
            The page you requested could not be found or has been moved to safety.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            to="/elderly"
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Senior Mode</span>
          </Link>
          <Link
            to="/"
            className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
          >
            Go to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
