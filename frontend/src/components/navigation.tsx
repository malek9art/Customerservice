'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'الرئيسية', detail: 'Executive', href: '/', icon: '📊' },
  { name: 'مركز العمليات', detail: 'Admin', href: '/operations', icon: '🏢' },
  { name: 'الحج والعمرة', detail: 'Pilgrimage', href: '/pilgrimage', icon: '🕋' },
  { name: 'الطيران', detail: 'Flights & GDS', href: '/flights', icon: '✈️' },
  { name: 'المحاسبة', detail: 'Financial Ledger', href: '/accounting', icon: '💰' },
  { name: 'بوابة العميل', detail: 'Customer Portal', href: '/customer', icon: '👤' },
  { name: 'بوابة الموظف', detail: 'Employee Hub', href: '/employee', icon: '💼' },
  { name: 'المساعد الذكي', detail: 'AI Copilot', href: '/ai-copilot', icon: '🤖' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden min-h-screen w-64 flex-col border-l border-slate-800 bg-slate-900 text-slate-100 md:flex">
        <div className="flex items-center gap-3 border-b border-slate-800 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30">T</div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">TravelOS AI</h1>
            <p className="text-xs font-medium text-indigo-400">Travel Operations Platform</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>
                  <span className="block font-bold">{item.name}</span>
                  <span className="block text-[10px] opacity-60">{item.detail}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-slate-300">نطاق الشركة:</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">نشط LIVE</span>
          </div>
          <p className="truncate font-mono text-slate-400">comp-id (Enterprise)</p>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t border-slate-700 bg-slate-950/95 px-2 py-2 text-white shadow-2xl backdrop-blur md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-20 flex-col items-center rounded-xl px-2 py-1.5 text-[10px] font-bold ${isActive ? 'bg-indigo-600' : 'text-slate-300'}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5 whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
