'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';

export default function EmployeeHubPage() {
  const [activeTab, setActiveTab] = useState<'crm' | 'visa' | 'passports' | 'escalations'>('crm');

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">بوابة الموظف ومركز إدارة العملاء CRM 360</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة ملفات العملاء، خط سير طلبات التأشيرات، حركة أمانات الجوازات، وحالات المساعدة البشرية</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 space-x-reverse border-b border-slate-100 pb-4">
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'crm' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ملف العميل الشامل (CRM 360 View)
            </button>
            <button
              onClick={() => setActiveTab('visa')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'visa' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              طلبات التأشيرات (Visa Kanban)
            </button>
            <button
              onClick={() => setActiveTab('passports')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'passports' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              حركة أمانات الجوازات (Passport Inventory)
            </button>
            <button
              onClick={() => setActiveTab('escalations')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'escalations' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              المساعدات المرفوعة من AI (Human Escalation Queue)
            </button>
          </div>

          {/* Tab 1: CRM 360 View */}
          {activeTab === 'crm' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center">
                      JD
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">John Doe (أحمد علي)</h3>
                      <p className="text-xs text-slate-500">الهاتف: +966 50 123 4567 | الجنسية: سعودي (SA)</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg">
                    تصنيف: VIP Regular
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">السجل الزمني التفاعلي (Activity Timeline):</h4>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-indigo-600 font-bold">[WHATSAPP_QUERY]</span>
                      <span className="text-slate-700">استفسار عن عمرة رمضان وتذاكر طيران دبي</span>
                      <span className="text-slate-400">2026-07-18 10:15</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-emerald-600 font-bold">[BOOKING_CONFIRMED]</span>
                      <span className="text-slate-700">حجز برنامج عمرة رمضان VIP وتوزيع الغرفة ROOM-104</span>
                      <span className="text-slate-400">2026-07-18 10:18</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Visa Kanban */}
          {activeTab === 'visa' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-amber-700 block">طلبات جديدة (Submitted)</span>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono space-y-1">
                  <span className="font-bold text-slate-800">VISA-8X9A1002</span>
                  <p className="text-slate-500">أحمد علي - تأشيرة عمرة</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-sky-700 block">قيد المعالجة بالسفارة (Processing)</span>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono space-y-1">
                  <span className="font-bold text-slate-800">VISA-3B128794</span>
                  <p className="text-slate-500">خالد عمر - تأشيرة حج</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-emerald-700 block">تم الإصدار (Approved ✓)</span>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono space-y-1">
                  <span className="font-bold text-slate-800">VISA-11223344</span>
                  <p className="text-slate-500">سارة علي - تأشيرة عمرة</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Passports Inventory */}
          {activeTab === 'passports' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">جواز سفر N1234567 (أحمد علي)</span>
                  <p className="text-slate-500 font-sans">الموقع الحالي: الخزنة الرئيسية Safe 01</p>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold">IN_SAFE</span>
              </div>
            </div>
          )}

          {/* Tab 4: AI Escalations */}
          {activeTab === 'escalations' && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              ✓ لا توجد حالات تصعيد معلقة حالياً - جميع استفسارات العائلات تمت معالجتها آلياً وبثقة 98%+ عبر AI Multi-Agent Chains
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
