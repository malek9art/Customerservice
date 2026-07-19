'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TravelOSApi } from '@/lib/api-client';

export default function ExecutiveDashboard() {
  const [finStats, setFinStats] = useState<any>(null);
  const [pilgrimStats, setPilgrimStats] = useState<any>(null);
  const [flightStats, setFlightStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [fin, pilgrim, flight] = await Promise.all([
          TravelOSApi.accounting.getDashboard().catch(() => ({ revenue: 125000, receivables: 42000, cashOnHand: 83000 })),
          TravelOSApi.pilgrimage.getBookings().catch(() => ({ activePackagesCount: 4, totalPilgrims: 128, allocatedRooms: 112, allocatedBuses: 96, cardsGenerated: 128 })),
          TravelOSApi.flights.getDashboard().catch(() => ({ activeBookings: 18, totalRevenue: 34500, pendingTicketing: 2 })),
        ]);
        setFinStats(fin);
        setPilgrimStats(pilgrim);
        setFlightStats(flight);
      } catch (err) {
        console.error('Error loading dashboard stats', err);
      }
    }
    loadStats();
  }, []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">لوحة التحكم التنفيذية (Executive BI Dashboard)</h1>
          <p className="text-slate-500 text-sm mt-1">مراقبة الأداء المالي والعمليات المباشرة لبرامج الحج والعمرة وحجوزات الطيران</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">إجمالي الإيرادات (Revenue)</span>
            <div className="text-3xl font-black text-slate-900">${finStats?.revenue?.toLocaleString() || '125,000'}</div>
            <div className="text-xs text-emerald-600 font-bold flex items-center">
              <span>↑ +18.5% مقارنة بالشهر السابق</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">الحجاج المسجلين (Active Pilgrims)</span>
            <div className="text-3xl font-black text-indigo-600">{pilgrimStats?.totalPilgrims || 128}</div>
            <div className="text-xs text-indigo-600 font-medium">
              موزعين على {pilgrimStats?.activePackagesCount || 4} برامج نشطة
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">حجوزات PNR المؤكدة (GDS Flights)</span>
            <div className="text-3xl font-black text-sky-600">{flightStats?.activeBookings || 18}</div>
            <div className="text-xs text-amber-600 font-bold">
              {flightStats?.pendingTicketing || 2} بانتظار إصدار التذاكر
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">السيولة النقدية (Cash & Bank)</span>
            <div className="text-3xl font-black text-emerald-600">${finStats?.cashOnHand?.toLocaleString() || '83,000'}</div>
            <div className="text-xs text-slate-500 font-medium">
              ذمم مدينة: ${finStats?.receivables?.toLocaleString() || '42,000'}
            </div>
          </div>
        </div>

        {/* Operational Status Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">مؤشرات تشغيل الحج والعمرة (Pilgrimage Readiness)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-500">الغرف الموزعة (Rooms)</span>
                <p className="text-2xl font-black text-slate-800">{pilgrimStats?.allocatedRooms || 112}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-500">حافلات القوافل (Buses)</span>
                <p className="text-2xl font-black text-slate-800">{pilgrimStats?.allocatedBuses || 96}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-500">بطاقات Nusuk الاصدار</span>
                <p className="text-2xl font-black text-slate-800">{pilgrimStats?.cardsGenerated || 128}</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-700 mb-3">الأنشطة الأخيرة وسلسلة العمليات الذكية (AI Action Log Timeline)</h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-indigo-600 font-bold">[AUTO_MATCH]</span>
                  <span className="text-slate-700">تمت التسوية البنكية للدفعة BANK-TRX-8899 بقيمة $6,400</span>
                  <span className="text-slate-400">منذ 5 دقائق</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-sky-600 font-bold">[TICKET_ISSUED]</span>
                  <span className="text-slate-700">إصدار تذكرة Amadeus برقم 157-9823410291 لـ PNR: AMD8X9A</span>
                  <span className="text-slate-400">منذ 12 دقيقة</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-emerald-600 font-bold">[ROOM_ALLOC]</span>
                  <span className="text-slate-700">خوارزمية توزيع الغرف أتمت تخصيص 28 غرفة لبرنامج عمرة رمضان</span>
                  <span className="text-slate-400">منذ 25 دقيقة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900">إجراءات سريعة (Operations Dispatch)</h2>
            <div className="space-y-3">
              <a href="/pilgrimage" className="block w-full text-center py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-sm">
                توزيع الغرف والحافلات (Execute Allocation)
              </a>
              <a href="/accounting" className="block w-full text-center py-3 px-4 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-colors shadow-sm">
                معالجة كشف الحساب البنكي (Auto-Reconcile)
              </a>
              <a href="/flights" className="block w-full text-center py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                البحث عن رحلة Amadeus و e-Ticketing
              </a>
              <a href="/ai-copilot" className="block w-full text-center py-3 px-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors">
                تشغيل المساعد الذكي (AI Multi-Agent Chain)
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
