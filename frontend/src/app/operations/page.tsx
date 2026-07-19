'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  Customer,
  Passport,
  TravelOSApi,
  VisaApplication,
} from '@/lib/api-client';

const PASSPORT_STATUSES = [
  'RECEIVED_BY_AGENCY',
  'IN_SAFE',
  'SUBMITTED_TO_EMBASSY',
  'RECEIVED_FROM_EMBASSY',
  'READY_FOR_COLLECTION',
  'DELIVERED_TO_CUSTOMER',
  'WITH_CUSTOMER',
  'LOST',
  'DAMAGED',
];

const statusLabels: Record<string, string> = {
  RECEIVED_BY_AGENCY: 'مستلم لدى الوكالة',
  IN_SAFE: 'في الخزنة',
  SUBMITTED_TO_EMBASSY: 'مرسل إلى السفارة',
  RECEIVED_FROM_EMBASSY: 'مستلم من السفارة',
  READY_FOR_COLLECTION: 'جاهز للتسليم',
  DELIVERED_TO_CUSTOMER: 'سُلّم للعميل',
  WITH_CUSTOMER: 'مع العميل',
  LOST: 'مفقود',
  DAMAGED: 'تالف',
};

function Panel({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-black text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-bold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100';
const primaryButton =
  'rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50';

export default function OperationsDashboard() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [inventory, setInventory] = useState<Passport[]>([]);
  const [selectedPassportId, setSelectedPassportId] = useState('');
  const [visaResult, setVisaResult] = useState<VisaApplication | null>(null);

  const [customerForm, setCustomerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationality: 'YE',
  });
  const [passportForm, setPassportForm] = useState({
    passportNumber: '',
    receivedById: 'emp-101',
    location: 'مكتب الاستلام',
  });
  const [statusForm, setStatusForm] = useState({
    status: 'IN_SAFE',
    location: 'الخزنة الرئيسية',
    actorId: 'emp-101',
    notes: '',
  });
  const [visaForm, setVisaForm] = useState({
    country: 'SA',
    visaType: 'TOURIST',
  });

  const showError = (error: unknown) => {
    setNotice({
      type: 'error',
      text: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
    });
  };

  const refreshCustomer = useCallback(async (customerId: string) => {
    const customer = await TravelOSApi.customers.get360(customerId);
    setSelectedCustomer(customer);
    return customer;
  }, []);

  const loadCustomers = useCallback(async (search = '') => {
    const results = await TravelOSApi.customers.search(search);
    setCustomers(results);
    return results;
  }, []);

  const loadInventory = useCallback(async () => {
    const passports = await TravelOSApi.passports.getInventory();
    setInventory(passports);
    return passports;
  }, []);

  useEffect(() => {
    Promise.all([
      TravelOSApi.health(),
      TravelOSApi.customers.search(''),
      TravelOSApi.passports.getInventory(),
    ])
      .then(([, customerResults, passports]) => {
        setCustomers(customerResults);
        setInventory(passports);
        setConnected(true);
      })
      .catch((error) => {
        setConnected(false);
        setNotice({
          type: 'error',
          text: error instanceof Error ? error.message : 'تعذر الاتصال بالخادم',
        });
      });
  }, []);

  const customerPassports = useMemo(() => {
    if (!selectedCustomer) return [];
    return inventory.filter((passport) => passport.customerId === selectedCustomer.id);
  }, [inventory, selectedCustomer]);
  const activePassportId = customerPassports.some(
    (passport) => passport.id === selectedPassportId,
  )
    ? selectedPassportId
    : customerPassports[0]?.id || '';

  async function runTask(name: string, task: () => Promise<void>) {
    setBusy(name);
    setNotice(null);
    try {
      await task();
      setConnected(true);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(null);
    }
  }

  const createCustomer = (event: FormEvent) => {
    event.preventDefault();
    void runTask('create-customer', async () => {
      const created = await TravelOSApi.customers.create({
        fullName: customerForm.fullName.trim(),
        phone: customerForm.phone.trim(),
        email: customerForm.email.trim() || undefined,
        nationality: customerForm.nationality.trim() || undefined,
      });
      await loadCustomers();
      await refreshCustomer(created.id);
      setNotice({ type: 'success', text: `تم إنشاء ملف العميل ${created.fullName} واختياره للعمل.` });
      setCustomerForm({ fullName: '', phone: '', email: '', nationality: 'YE' });
    });
  };

  const searchCustomers = (event: FormEvent) => {
    event.preventDefault();
    void runTask('search', async () => {
      const results = await loadCustomers(query.trim());
      setNotice({ type: 'success', text: `تم العثور على ${results.length} عميل.` });
    });
  };

  const selectCustomer = (customerId: string) => {
    void runTask('customer-360', async () => {
      await refreshCustomer(customerId);
      setVisaResult(null);
    });
  };

  const receivePassport = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCustomer) return;
    void runTask('receive-passport', async () => {
      const passport = await TravelOSApi.passports.receive({
        customerId: selectedCustomer.id,
        passportNumber: passportForm.passportNumber.trim(),
        receivedById: passportForm.receivedById.trim(),
        location: passportForm.location.trim() || undefined,
      });
      await Promise.all([loadInventory(), refreshCustomer(selectedCustomer.id)]);
      setSelectedPassportId(passport.id);
      setPassportForm((current) => ({ ...current, passportNumber: '' }));
      setNotice({ type: 'success', text: `تم استلام الجواز ${passport.passportNumber} وتسجيل عهدته.` });
    });
  };

  const updatePassport = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCustomer || !activePassportId) return;
    void runTask('update-passport', async () => {
      const passport = await TravelOSApi.passports.updateStatus(activePassportId, {
        status: statusForm.status,
        location: statusForm.location.trim(),
        actorId: statusForm.actorId.trim(),
        notes: statusForm.notes.trim() || undefined,
      });
      await Promise.all([loadInventory(), refreshCustomer(selectedCustomer.id)]);
      setNotice({
        type: 'success',
        text: `تم تحديث الجواز ${passport.passportNumber} إلى: ${statusLabels[passport.status] || passport.status}.`,
      });
    });
  };

  const createVisa = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCustomer) return;
    void runTask('create-visa', async () => {
      const application = await TravelOSApi.visas.create({
        customerId: selectedCustomer.id,
        country: visaForm.country.trim().toUpperCase(),
        visaType: visaForm.visaType,
      });
      setVisaResult(application);
      await refreshCustomer(selectedCustomer.id);
      setNotice({
        type: 'success',
        text: `تم إنشاء طلب التأشيرة ${application.referenceNumber || application.id}.`,
      });
    });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">TravelOS Operations</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">مركز عمليات العملاء والجوازات</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              مساحة عمل موحدة لموظف الوكالة: افتح ملف العميل، راجع ملفه الشامل، ثم نفّذ معاملات الجواز والتأشيرة.
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${
            connected === true
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : connected === false
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : connected === false ? 'bg-rose-500' : 'bg-amber-500'}`} />
            {connected === true ? 'Backend متصل' : connected === false ? 'Backend غير متصل' : 'جاري فحص الاتصال'}
          </div>
        </div>

        {notice && (
          <div role="alert" className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}>
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} className="text-lg leading-none" aria-label="إغلاق">×</button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel title="إنشاء عميل جديد" description="ابدأ المعاملة بإنشاء ملف CRM موحد.">
              <form onSubmit={createCustomer} className="space-y-4">
                <Field label="الاسم الكامل *">
                  <input required className={inputClass} value={customerForm.fullName} onChange={(e) => setCustomerForm({ ...customerForm, fullName: e.target.value })} placeholder="مثال: أحمد محمد علي" />
                </Field>
                <Field label="رقم الهاتف *">
                  <input required className={inputClass} value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="+967771234567" dir="ltr" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="البريد الإلكتروني">
                    <input type="email" className={inputClass} value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} dir="ltr" />
                  </Field>
                  <Field label="الجنسية">
                    <input className={inputClass} value={customerForm.nationality} onChange={(e) => setCustomerForm({ ...customerForm, nationality: e.target.value })} dir="ltr" />
                  </Field>
                </div>
                <button disabled={busy !== null} className={`${primaryButton} w-full`}>
                  {busy === 'create-customer' ? 'جاري إنشاء الملف...' : 'إنشاء العميل وفتح ملفه'}
                </button>
              </form>
            </Panel>

            <Panel title="البحث عن عميل" description="ابحث بالاسم أو الهاتف أو البريد.">
              <form onSubmit={searchCustomers} className="flex gap-2">
                <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اكتب كلمة البحث" />
                <button disabled={busy !== null} className={primaryButton}>بحث</button>
              </form>
              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => selectCustomer(customer.id)}
                    className={`w-full rounded-xl border p-3 text-right transition ${
                      selectedCustomer?.id === customer.id
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-black text-slate-900">{customer.fullName}</span>
                    <span className="mt-1 block text-xs text-slate-500" dir="ltr">{customer.phone}</span>
                  </button>
                ))}
                {!customers.length && <p className="py-6 text-center text-sm text-slate-400">لا توجد نتائج.</p>}
              </div>
            </Panel>
          </div>

          <div className="space-y-6">
            {!selectedCustomer ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">👤</div>
                  <h2 className="font-black text-slate-800">اختر عميلًا لبدء المعاملة</h2>
                  <p className="mt-2 text-sm text-slate-500">أنشئ عميلاً جديداً أو اختر ملفاً من نتائج البحث.</p>
                </div>
              </div>
            ) : (
              <>
                <Panel title="ملف العميل 360" description={`رقم الملف: ${selectedCustomer.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-black text-white">
                        {selectedCustomer.fullName.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{selectedCustomer.fullName}</h3>
                        <p className="text-sm text-slate-500" dir="ltr">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{selectedCustomer.nationality || 'غير محدد'}</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">{customerPassports.length} جواز</span>
                      <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-700">{selectedCustomer.visas?.length || 0} تأشيرة</span>
                    </div>
                  </div>
                  {selectedCustomer.aiInsights && (
                    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                      <p className="text-xs font-black text-indigo-700">ملخص المساعد التشغيلي</p>
                      <p className="mt-1 text-sm leading-6 text-indigo-950">{selectedCustomer.aiInsights.summary}</p>
                    </div>
                  )}
                </Panel>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Panel title="استلام جواز" description="سجّل الجواز كعهدة مرتبطة بملف العميل.">
                    <form onSubmit={receivePassport} className="space-y-4">
                      <Field label="رقم الجواز *">
                        <input required className={inputClass} value={passportForm.passportNumber} onChange={(e) => setPassportForm({ ...passportForm, passportNumber: e.target.value })} placeholder="A1234567" dir="ltr" />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="موظف الاستلام *">
                          <input required className={inputClass} value={passportForm.receivedById} onChange={(e) => setPassportForm({ ...passportForm, receivedById: e.target.value })} dir="ltr" />
                        </Field>
                        <Field label="موقع الاستلام">
                          <input className={inputClass} value={passportForm.location} onChange={(e) => setPassportForm({ ...passportForm, location: e.target.value })} />
                        </Field>
                      </div>
                      <button disabled={busy !== null} className={`${primaryButton} w-full`}>
                        {busy === 'receive-passport' ? 'جاري تسجيل العهدة...' : 'استلام الجواز'}
                      </button>
                    </form>
                  </Panel>

                  <Panel title="تحديث حركة الجواز" description="انقل الجواز بين مراحل الحيازة مع سجل الموظف.">
                    <form onSubmit={updatePassport} className="space-y-4">
                      <Field label="الجواز *">
                        <select required className={inputClass} value={activePassportId} onChange={(e) => setSelectedPassportId(e.target.value)}>
                          <option value="">اختر جوازاً</option>
                          {customerPassports.map((passport) => (
                            <option key={passport.id} value={passport.id}>{passport.passportNumber} — {statusLabels[passport.status] || passport.status}</option>
                          ))}
                        </select>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="الحالة الجديدة *">
                          <select className={inputClass} value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}>
                            {PASSPORT_STATUSES.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                          </select>
                        </Field>
                        <Field label="الموقع *">
                          <input required className={inputClass} value={statusForm.location} onChange={(e) => setStatusForm({ ...statusForm, location: e.target.value })} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="الموظف المنفذ *">
                          <input required className={inputClass} value={statusForm.actorId} onChange={(e) => setStatusForm({ ...statusForm, actorId: e.target.value })} dir="ltr" />
                        </Field>
                        <Field label="ملاحظات">
                          <input className={inputClass} value={statusForm.notes} onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })} />
                        </Field>
                      </div>
                      <button disabled={busy !== null || !activePassportId} className={`${primaryButton} w-full`}>
                        {busy === 'update-passport' ? 'جاري تحديث الحركة...' : 'حفظ حركة الجواز'}
                      </button>
                    </form>
                  </Panel>
                </div>

                <Panel title="جوازات العميل" description="الحالة الحالية للعهد المسجلة.">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {customerPassports.map((passport) => (
                      <button key={passport.id} type="button" onClick={() => setSelectedPassportId(passport.id)} className="rounded-xl border border-slate-200 p-4 text-right hover:border-indigo-300">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="font-mono text-sm text-slate-900">{passport.passportNumber}</strong>
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">{statusLabels[passport.status] || passport.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">الموقع: {passport.location || 'غير محدد'}</p>
                      </button>
                    ))}
                    {!customerPassports.length && <p className="text-sm text-slate-400">لا توجد جوازات مسجلة لهذا العميل.</p>}
                  </div>
                </Panel>

                <Panel title="إنشاء طلب تأشيرة" description="أنشئ الطلب مباشرة من ملف العميل الحالي.">
                  <form onSubmit={createVisa} className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]">
                    <Field label="الدولة *">
                      <input required className={inputClass} value={visaForm.country} onChange={(e) => setVisaForm({ ...visaForm, country: e.target.value })} placeholder="SA" dir="ltr" />
                    </Field>
                    <Field label="نوع التأشيرة *">
                      <select className={inputClass} value={visaForm.visaType} onChange={(e) => setVisaForm({ ...visaForm, visaType: e.target.value })}>
                        <option value="TOURIST">سياحية</option>
                        <option value="UMRAH">عمرة</option>
                        <option value="HAJJ">حج</option>
                        <option value="BUSINESS">أعمال</option>
                        <option value="TRANSIT">عبور</option>
                      </select>
                    </Field>
                    <button disabled={busy !== null} className={primaryButton}>
                      {busy === 'create-visa' ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
                    </button>
                  </form>
                  {visaResult && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-emerald-900">المرجع: {visaResult.referenceNumber || visaResult.id}</strong>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{visaResult.status}</span>
                      </div>
                      <p className="mt-2 text-emerald-800">{visaResult.country} — {visaResult.visaType}</p>
                    </div>
                  )}
                </Panel>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
