'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';

export default function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'cards' | 'invoices' | 'vault'>('bookings');

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Customer Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-600/30">
              JA
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">بوابة العميل الذكية (Customer Portal)</h1>
              <p className="text-slate-500 text-sm mt-0.5">مرحباً بك، <strong className="text-slate-800">John Doe (أحمد علي)</strong> | الهوية: SA-9820194</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
              الحالة: عميل VIP موثق ✓
            </span>
          </div>
        </div>

        {/* Portal Tabs Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-100 pb-4">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              حجوزاتي المباشرة (Active Bookings)
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'cards' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              بطاقة الحاج Nusuk PDF
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'invoices' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              الفواتير وسجل الدفع (Invoices)
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'vault' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              خزنة الوثائق والجوازات (Document Vault)
            </button>
          </div>

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-extrabold text-xs rounded-md uppercase font-mono">UMRAH PACKAGE</span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2">برنامج عمرة رمضان VIP - 1447H</h3>
                    <p className="text-xs text-slate-500">مكة المكرمة: فندق رويال دار الإيمان | المدينة المنورة: فندق دار التقوى</p>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-xs text-emerald-600 font-bold block">مؤكد LIVE ✓</span>
                    <span className="text-slate-800 font-bold text-sm">تاريخ السفر: 2026-09-10</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">رقم الحافلة والمقعد:</span> <strong className="text-slate-800 font-mono">BUS-101 (مقعد 12، 13)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">الغرفة المخصصة:</span> <strong className="text-slate-800 font-mono">ROOM-104 [DOUBLE]</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">تذكرة الطيران:</span> <strong className="text-sky-600 font-mono">PNR: AMD8X9A (157-9823410291)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Nusuk Cards Tab */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900">بطاقة الحاج الرقمية Nusuk - أحمد علي</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">رمز التحقق: NUSUK:pilgrim-001:N1234567:TravelOS</p>
                </div>
                <a
                  href="https://storage.travelos.ai/comp-id/public/pilgrim-card-001.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  فتح بطاقة Nusuk PDF 📥
                </a>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 text-sm">فاتورة رقم: INV-UMRAH-2026</span>
                  <p className="text-slate-500 font-sans mt-0.5">تسوية حجز برنامج العمرة وتذاكر الطيران</p>
                </div>
                <div className="text-left">
                  <div className="text-emerald-600 font-black text-sm">مسددة بالكامل (PAID) ✓</div>
                  <span className="text-slate-400">$6,400 USD</span>
                </div>
              </div>
            </div>
          )}

          {/* Document Vault Tab */}
          {activeTab === 'vault' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm">رفع مستند جديد للخزنة (Upload Passport / Visa)</h3>
                  <span className="text-xs text-indigo-600 font-bold">معالجة OCR تلقائية 🔍</span>
                </div>
                <input type="file" className="text-xs font-mono text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
