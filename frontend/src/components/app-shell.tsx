'use client';

import { ReactNode } from 'react';
import { Navigation } from './navigation';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navigation />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white md:hidden">T</div>
            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              البيئة التشغيلية المباشرة
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden font-medium text-slate-500 sm:inline">الشركة: <strong className="text-slate-800">وكالة السفر الذكية</strong></span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 font-bold text-indigo-700">AD</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
