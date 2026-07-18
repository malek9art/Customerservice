'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'الرئيسية (Executive)', href: '/', icon: '📊' },
    { name: 'عمليات الحج والعمرة (Pilgrimage)', href: '/pilgrimage', icon: '🕋' },
    { name: 'حجوزات الطيران (Flights & GDS)', href: '/flights', icon: '✈️' },
    { name: 'الدفتر المحاسبي (Financial Ledger)', href: '/accounting', icon: '💰' },
    { name: 'بوابة العميل (Customer Portal)', href: '/customer', icon: '👤' },
    { name: 'بوابة الموظف (Employee Hub)', href: '/employee', icon: '💼' },
    { name: 'مساعد AI ذكي (AI Copilot)', href: '/ai-copilot', icon: '🤖' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-l border-slate-800">
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3 space-x-reverse">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/30">
          T
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-tight text-white">TravelOS AI</h1>
          <p className="text-xs text-indigo-400 font-medium">V0.97 Commercial Enterprise</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-950/50">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-300">نطاق الشركة:</span>
          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">نشط LIVE</span>
        </div>
        <p className="truncate text-slate-400 font-mono">comp-id (Enterprise)</p>
      </div>
    </aside>
  );
}
