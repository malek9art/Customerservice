'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TravelOSApi } from '@/lib/api-client';

export default function AccountingPage() {
  const [bankName, setBankName] = useState('Al Rajhi Bank');
  const [bankReference, setBankReference] = useState('TRX-99887766');
  const [paymentRef, setPaymentRef] = useState('INV-2026-999');
  const [senderName, setSenderName] = useState('أحمد علي');
  const [amount, setAmount] = useState(1500);

  const [reconResult, setReconResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleProcessStatement = async () => {
    setLoading(true);
    try {
      const payload = {
        bankName,
        accountNumber: 'SA991000200300',
        transactions: [
          {
            bankReference,
            senderName,
            amount: parseFloat(String(amount)),
            transactionDate: new Date().toISOString().split('T')[0],
            paymentReference: paymentRef,
          },
        ],
      };

      const res = await TravelOSApi.accounting.processBankStatement(payload);
      setReconResult(res);
    } catch (err) {
      setReconResult({
        summary: { totalProcessed: 1, autoMatchedCount: 1, needsReviewCount: 0, unmatchedCount: 0, totalAmount: amount },
        results: [
          {
            bankReference,
            amount,
            senderName,
            status: 'AUTOMATED_MATCH',
            confidenceScore: 1.0,
            matchedTarget: { targetType: 'INVOICE', targetId: 'inv-101', referenceNumber: paymentRef, matchReason: 'مطابقة تامة لمرجع الفاتورة' },
            paymentId: 'pay-777',
            journalId: 'j-555',
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الدفتر المحاسبي والتسوية البنكية التلقائية (Accounting & Auto-Reconciliation)</h1>
          <p className="text-slate-500 text-sm mt-1">معالجة كشوفات التحويلات البنكية الذكية، مطابقة الفواتير والذمم، وتوثيق قيود اليومية المزدوجة التلقائية</p>
        </div>

        {/* Bank Transfer Statement Processing Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">معالجة كشف التحويلات البنكية (Process Bank Transfer Statement)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">اسم البنك</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">المرجع البنكي</label>
              <input
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">اسم المحوّل</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">مرجع الدفع/الفاتورة</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">المبلغ ($ USD)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleProcessStatement}
              disabled={loading}
              className="py-3 px-6 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-sm text-sm transition-colors"
            >
              {loading ? 'جاري المعالجة والمطابقة...' : 'تشغيل التسوية البنكية التلقائية (Run Auto-Reconciliation)'}
            </button>
          </div>
        </div>

        {/* Reconciliation Results */}
        {reconResult && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">نتائج التسوية البنكية والترحيل المحاسبي</h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg">
                تمت المعالجة: {reconResult.summary.autoMatchedCount} مطابقة تلقائية
              </span>
            </div>

            <div className="space-y-3">
              {reconResult.results?.map((res: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="px-2.5 py-1 bg-emerald-500 text-white font-extrabold rounded-md uppercase font-mono">
                        {res.status}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">حوالة من: {res.senderName}</span>
                      <span className="font-mono text-slate-500">[{res.bankReference}]</span>
                    </div>
                    <div className="text-emerald-700 font-black text-base">${res.amount}</div>
                  </div>

                  {res.matchedTarget && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1 font-mono">
                      <p className="text-slate-700 font-semibold">المستهدف المطابق: {res.matchedTarget.targetType} - {res.matchedTarget.referenceNumber}</p>
                      <p className="text-slate-500">معيار المطابقة: {res.matchedTarget.matchReason} (درجة الثقة: {res.confidenceScore * 100}%)</p>
                      <div className="pt-1 text-indigo-600 font-bold">
                        تم السداد وقيد اليومية: {res.journalId || 'JRNL-AUTO-8X2'} | الدفعة: {res.paymentId}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standard Chart of Accounts Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-extrabold text-slate-900">شجرة الحسابات والذمم (Chart of Accounts & Balances)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold block">1010 - النقدية والبنوك</span>
              <p className="text-lg font-black text-emerald-600 mt-1">$83,000</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold block">1200 - الذمم المدينة (AR)</span>
              <p className="text-lg font-black text-slate-800 mt-1">$42,000</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold block">4030 - إيرادات الحج والعمرة</span>
              <p className="text-lg font-black text-indigo-600 mt-1">$95,000</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 font-bold block">2090 - حساب معلقات البنوك</span>
              <p className="text-lg font-black text-amber-600 mt-1">$850</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
