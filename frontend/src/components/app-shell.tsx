'use client';

import React from 'react';
import { Navigation } from './navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navigation />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm font-semibold text-slate-7 Operational Badge px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              البيئة التشغيلية المباشرة (Live Operations)
            </span>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse text-sm">
            <span className="text-slate-500 font-medium">الشركة: <strong className="text-slate-800">وكالة السفر الذكية</strong></span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200">
              AD
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
