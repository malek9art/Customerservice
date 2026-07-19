'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  Customer,
  FlightBooking,
  FlightOffer,
  HotelBooking,
  HotelGuest,
  HotelOffer,
  Passport,
  TravelOSApi,
  TravelPackage,
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

const flightStatusLabels: Record<string, string> = {
  PNR_CREATED: 'حجز مؤكد',
  TICKETED: 'تم إصدار التذكرة',
  CANCELLED: 'ملغي',
};

function offerRoute(offer: FlightOffer) {
  const segment = offer.itineraries[0]?.segments?.[0];
  const departure = typeof segment?.departure === 'string'
    ? segment.departure
    : segment?.departure?.iataCode;
  const arrival = typeof segment?.arrival === 'string'
    ? segment.arrival
    : segment?.arrival?.iataCode;
  return `${departure || '—'} → ${arrival || '—'}`;
}

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
  const [flightOffers, setFlightOffers] = useState<FlightOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [flightInsight, setFlightInsight] = useState('');
  const [hotelOffers, setHotelOffers] = useState<HotelOffer[]>([]);
  const [selectedHotelOfferId, setSelectedHotelOfferId] = useState('');
  const [selectedHotelRoomId, setSelectedHotelRoomId] = useState('');
  const [hotelInsight, setHotelInsight] = useState('');
  const [editingHotelId, setEditingHotelId] = useState('');
  const [hotelCancellationReason, setHotelCancellationReason] = useState('طلب إلغاء من العميل');
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [editingPackageId, setEditingPackageId] = useState('');

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
  const [flightSearchForm, setFlightSearchForm] = useState({
    origin: 'ADE',
    destination: 'JED',
    departureDate: '2026-09-10',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'ECONOMY',
  });
  const [passengerForm, setPassengerForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
  });
  const [hotelSearchForm, setHotelSearchForm] = useState({
    city: 'Jeddah',
    country: 'SA',
    checkIn: '2026-09-10',
    checkOut: '2026-09-15',
    rooms: 1,
    adults: 1,
    children: 0,
  });
  const [hotelGuestForm, setHotelGuestForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [packageForm, setPackageForm] = useState({
    name: '', type: 'TOURISM', season: '', description: '', startDate: '2026-10-01',
    endDate: '2026-10-10', basePrice: 1500, currency: 'USD', capacity: 30, status: 'DRAFT',
  });
  const [hotelEditForm, setHotelEditForm] = useState({
    checkIn: '',
    checkOut: '',
    roomId: '',
    roomCount: 1,
    adults: 1,
    children: 0,
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
      TravelOSApi.packages.list(),
    ])
      .then(([, customerResults, passports, packageResults]) => {
        setCustomers(customerResults);
        setInventory(passports);
        setPackages(packageResults);
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
      const nameParts = created.fullName.trim().split(/\s+/);
      setPassengerForm((current) => ({
        ...current,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        email: created.email || '',
      }));
      setHotelGuestForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        email: created.email || '',
      });
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
      const customer = await refreshCustomer(customerId);
      const nameParts = customer.fullName.trim().split(/\s+/);
      setPassengerForm((current) => ({
        ...current,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        email: customer.email || '',
      }));
      setHotelGuestForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        email: customer.email || '',
      });
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

  const searchFlights = (event: FormEvent) => {
    event.preventDefault();
    void runTask('search-flights', async () => {
      const result = await TravelOSApi.flights.search({
        origin: flightSearchForm.origin.trim().toUpperCase(),
        destination: flightSearchForm.destination.trim().toUpperCase(),
        departureDate: flightSearchForm.departureDate,
        returnDate: flightSearchForm.returnDate || undefined,
        passengers: {
          adults: flightSearchForm.adults,
          children: flightSearchForm.children,
          infants: flightSearchForm.infants,
        },
        cabinClass: flightSearchForm.cabinClass,
      });
      setFlightOffers(result.offers);
      setSelectedOfferId(result.offers[0]?.id || '');
      setFlightInsight(result.aiInsights);
      setNotice({
        type: 'success',
        text: `تم العثور على ${result.offers.length} عرض رحلة متاح.`,
      });
    });
  };

  const createFlightBooking = (offer: FlightOffer) => {
    if (!selectedCustomer) return;
    void runTask('book-flight', async () => {
      const booking = await TravelOSApi.flights.createBooking({
        customerId: selectedCustomer.id,
        provider: offer.provider,
        offerId: offer.id,
        passengers: [{
          firstName: passengerForm.firstName.trim(),
          lastName: passengerForm.lastName.trim(),
          dateOfBirth: passengerForm.dateOfBirth || undefined,
          email: passengerForm.email.trim() || undefined,
        }],
      });
      setSelectedOfferId(offer.id);
      await refreshCustomer(selectedCustomer.id);
      setNotice({
        type: 'success',
        text: `تم إنشاء الحجز ${booking.referenceNumber} برقم PNR: ${booking.pnr}.`,
      });
    });
  };

  const issueFlightTicket = (booking: FlightBooking) => {
    if (!selectedCustomer) return;
    void runTask(`ticket-${booking.id}`, async () => {
      const updated = await TravelOSApi.flights.issueTicket(booking.id);
      await refreshCustomer(selectedCustomer.id);
      setNotice({
        type: 'success',
        text: `تم إصدار التذكرة للحجز ${updated.pnr}: ${updated.ticketNumbers?.join('، ') || 'تم الإصدار'}.`,
      });
    });
  };

  const cancelFlightBooking = (booking: FlightBooking) => {
    if (!selectedCustomer) return;
    void runTask(`cancel-flight-${booking.id}`, async () => {
      await TravelOSApi.flights.cancelBooking(
        booking.id,
        'Customer cancellation from operations dashboard',
      );
      await refreshCustomer(selectedCustomer.id);
      setNotice({ type: 'success', text: `تم إلغاء الحجز ${booking.pnr}.` });
    });
  };

  const buildHotelGuests = (
    adults: number,
    children: number,
    existing: HotelGuest[] = [],
  ): HotelGuest[] => {
    const existingAdults = existing.filter((guest) => guest.type === 'ADULT');
    const existingChildren = existing.filter((guest) => guest.type === 'CHILD');
    const adultGuests = Array.from({ length: adults }, (_, index): HotelGuest =>
      existingAdults[index] || {
        firstName: index === 0 ? hotelGuestForm.firstName.trim() : `Guest${index + 1}`,
        lastName: index === 0 ? hotelGuestForm.lastName.trim() : hotelGuestForm.lastName.trim(),
        email: index === 0 ? hotelGuestForm.email.trim() || undefined : undefined,
        type: 'ADULT',
      },
    );
    const childGuests = Array.from({ length: children }, (_, index): HotelGuest =>
      existingChildren[index] || {
        firstName: `Child${index + 1}`,
        lastName: hotelGuestForm.lastName.trim(),
        type: 'CHILD',
      },
    );
    return [...adultGuests, ...childGuests];
  };

  const searchHotels = (event: FormEvent) => {
    event.preventDefault();
    void runTask('search-hotels', async () => {
      const result = await TravelOSApi.hotels.search({
        ...hotelSearchForm,
        country: hotelSearchForm.country.trim().toUpperCase(),
        city: hotelSearchForm.city.trim(),
      });
      setHotelOffers(result.offers);
      setHotelInsight(result.aiInsights);
      const firstOffer = result.offers[0];
      setSelectedHotelOfferId(firstOffer?.id || '');
      setSelectedHotelRoomId(firstOffer?.rooms[0]?.id || '');
      setNotice({ type: 'success', text: `تم العثور على ${result.offers.length} فنادق متاحة.` });
    });
  };

  const createHotelBooking = (offer: HotelOffer, roomId: string) => {
    if (!selectedCustomer) return;
    void runTask('book-hotel', async () => {
      const booking = await TravelOSApi.hotels.createBooking({
        customerId: selectedCustomer.id,
        provider: offer.provider,
        offerId: offer.id,
        roomId,
        guests: buildHotelGuests(hotelSearchForm.adults, hotelSearchForm.children),
      });
      setSelectedHotelOfferId(offer.id);
      setSelectedHotelRoomId(roomId);
      await refreshCustomer(selectedCustomer.id);
      setNotice({
        type: 'success',
        text: `تم إنشاء حجز الفندق ${booking.referenceNumber} وتأكيده برقم ${booking.hotelConfirmationNumber}.`,
      });
    });
  };

  const beginHotelEdit = (booking: HotelBooking) => {
    setEditingHotelId(booking.id);
    setHotelEditForm({
      checkIn: new Date(booking.checkIn).toISOString().slice(0, 10),
      checkOut: new Date(booking.checkOut).toISOString().slice(0, 10),
      roomId: booking.roomDetails.selectedRoom.id,
      roomCount: booking.roomDetails.roomCount,
      adults: booking.guests.filter((guest) => guest.type === 'ADULT').length,
      children: booking.guests.filter((guest) => guest.type === 'CHILD').length,
    });
  };

  const updateHotelBooking = (event: FormEvent, booking: HotelBooking) => {
    event.preventDefault();
    if (!selectedCustomer) return;
    void runTask(`update-hotel-${booking.id}`, async () => {
      await TravelOSApi.hotels.updateBooking(booking.id, {
        checkIn: hotelEditForm.checkIn,
        checkOut: hotelEditForm.checkOut,
        roomId: hotelEditForm.roomId,
        roomCount: hotelEditForm.roomCount,
        guests: buildHotelGuests(
          hotelEditForm.adults,
          hotelEditForm.children,
          booking.guests,
        ),
      });
      await refreshCustomer(selectedCustomer.id);
      setEditingHotelId('');
      setNotice({ type: 'success', text: `تم تعديل حجز الفندق ${booking.referenceNumber}.` });
    });
  };

  const cancelHotelBooking = (booking: HotelBooking) => {
    if (!selectedCustomer || !hotelCancellationReason.trim()) return;
    void runTask(`cancel-hotel-${booking.id}`, async () => {
      await TravelOSApi.hotels.cancelBooking(booking.id, hotelCancellationReason.trim());
      await refreshCustomer(selectedCustomer.id);
      setEditingHotelId('');
      setNotice({ type: 'success', text: `تم إلغاء حجز الفندق ${booking.referenceNumber}.` });
    });
  };

  const savePackage = (event: FormEvent) => {
    event.preventDefault();
    void runTask('save-package', async () => {
      const payload = { ...packageForm, season: packageForm.season || undefined, description: packageForm.description || undefined };
      if (editingPackageId) await TravelOSApi.packages.update(editingPackageId, payload);
      else await TravelOSApi.packages.create(payload);
      setPackages(await TravelOSApi.packages.list());
      setEditingPackageId('');
      setPackageForm({ name: '', type: 'TOURISM', season: '', description: '', startDate: '2026-10-01', endDate: '2026-10-10', basePrice: 1500, currency: 'USD', capacity: 30, status: 'DRAFT' });
      setNotice({ type: 'success', text: 'تم حفظ باقة السفر بنجاح.' });
    });
  };

  const editPackage = (pkg: TravelPackage) => {
    setEditingPackageId(pkg.id);
    setPackageForm({ name: pkg.name, type: pkg.type, season: pkg.season || '', description: pkg.description || '', startDate: new Date(pkg.startDate).toISOString().slice(0, 10), endDate: new Date(pkg.endDate).toISOString().slice(0, 10), basePrice: Number(pkg.basePrice), currency: pkg.currency, capacity: pkg.capacity, status: pkg.status });
  };

  const changePackageCapacity = (pkg: TravelPackage, capacity: number) => {
    void runTask(`capacity-${pkg.id}`, async () => {
      await TravelOSApi.packages.setCapacity(pkg.id, capacity);
      setPackages(await TravelOSApi.packages.list());
      setNotice({ type: 'success', text: `تم تحديث سعة ${pkg.name}.` });
    });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-indigo-600">TravelOS Operations</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">مركز العمليات المتكامل</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              مساحة عمل موحدة لموظف الوكالة لإدارة ملف العميل والجوازات والتأشيرات وحجوزات السفر من مكان واحد.
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
                      <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">{selectedCustomer.flightBookings?.length || 0} رحلة</span>
                      <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-700">{selectedCustomer.hotelBookings?.length || 0} فندق</span>
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

                <Panel title="حجوزات الطيران" description="ابحث عن رحلة، اربط الحجز بالعميل، ثم أصدر التذكرة أو ألغِ الحجز.">
                  <form onSubmit={searchFlights} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <Field label="من *">
                      <input required minLength={3} maxLength={3} className={inputClass} value={flightSearchForm.origin} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, origin: e.target.value })} dir="ltr" />
                    </Field>
                    <Field label="إلى *">
                      <input required minLength={3} maxLength={3} className={inputClass} value={flightSearchForm.destination} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, destination: e.target.value })} dir="ltr" />
                    </Field>
                    <Field label="تاريخ الذهاب *">
                      <input required type="date" className={inputClass} value={flightSearchForm.departureDate} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, departureDate: e.target.value })} />
                    </Field>
                    <Field label="تاريخ العودة">
                      <input type="date" className={inputClass} value={flightSearchForm.returnDate} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, returnDate: e.target.value })} />
                    </Field>
                    <Field label="الدرجة">
                      <select className={inputClass} value={flightSearchForm.cabinClass} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, cabinClass: e.target.value })}>
                        <option value="ECONOMY">اقتصادية</option>
                        <option value="PREMIUM">اقتصادية مميزة</option>
                        <option value="BUSINESS">أعمال</option>
                        <option value="FIRST">أولى</option>
                      </select>
                    </Field>
                    <Field label="البالغون">
                      <input type="number" min={1} className={inputClass} value={flightSearchForm.adults} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, adults: Number(e.target.value) })} />
                    </Field>
                    <Field label="الأطفال">
                      <input type="number" min={0} className={inputClass} value={flightSearchForm.children} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, children: Number(e.target.value) })} />
                    </Field>
                    <Field label="الرضّع">
                      <input type="number" min={0} className={inputClass} value={flightSearchForm.infants} onChange={(e) => setFlightSearchForm({ ...flightSearchForm, infants: Number(e.target.value) })} />
                    </Field>
                    <div className="flex items-end">
                      <button disabled={busy !== null} className={`${primaryButton} w-full`}>
                        {busy === 'search-flights' ? 'جاري البحث...' : 'البحث عن الرحلات'}
                      </button>
                    </div>
                  </form>

                  {flightOffers.length > 0 && (
                    <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">بيانات المسافر للحجز</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <Field label="الاسم الأول *">
                            <input required className={inputClass} value={passengerForm.firstName} onChange={(e) => setPassengerForm({ ...passengerForm, firstName: e.target.value })} dir="ltr" />
                          </Field>
                          <Field label="اسم العائلة *">
                            <input required className={inputClass} value={passengerForm.lastName} onChange={(e) => setPassengerForm({ ...passengerForm, lastName: e.target.value })} dir="ltr" />
                          </Field>
                          <Field label="تاريخ الميلاد">
                            <input type="date" className={inputClass} value={passengerForm.dateOfBirth} onChange={(e) => setPassengerForm({ ...passengerForm, dateOfBirth: e.target.value })} />
                          </Field>
                          <Field label="البريد الإلكتروني">
                            <input type="email" className={inputClass} value={passengerForm.email} onChange={(e) => setPassengerForm({ ...passengerForm, email: e.target.value })} dir="ltr" />
                          </Field>
                        </div>
                      </div>

                      {flightInsight && (
                        <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-6 text-indigo-900">{flightInsight}</p>
                      )}

                      <div className="grid gap-3 lg:grid-cols-2">
                        {flightOffers.map((offer) => {
                          const firstSegment = offer.itineraries[0]?.segments?.[0];
                          return (
                            <article key={offer.id} className={`rounded-xl border p-4 ${selectedOfferId === offer.id ? 'border-indigo-300 bg-indigo-50/40' : 'border-slate-200'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-mono text-lg font-black text-slate-950" dir="ltr">{offerRoute(offer)}</p>
                                  <p className="mt-1 text-xs text-slate-500">{offer.validatingAirline} {firstSegment?.number || ''} · {offer.provider}</p>
                                  <p className="mt-1 text-xs text-slate-500" dir="ltr">{typeof firstSegment?.departure === 'object' ? firstSegment.departure.at : ''}</p>
                                </div>
                                <div className="text-left">
                                  <p className="text-xl font-black text-indigo-700">{offer.price.total}</p>
                                  <p className="text-xs font-bold text-slate-400">{offer.price.currency}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={busy !== null || !passengerForm.firstName.trim() || !passengerForm.lastName.trim()}
                                onClick={() => createFlightBooking(offer)}
                                className={`${primaryButton} mt-4 w-full`}
                              >
                                {busy === 'book-flight' && selectedOfferId === offer.id ? 'جاري إنشاء PNR...' : 'اختيار وإنشاء الحجز'}
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="mb-3 text-sm font-black text-slate-900">رحلات العميل في Customer 360</h3>
                    <div className="space-y-3">
                      {selectedCustomer.flightBookings?.map((booking) => (
                        <article key={booking.id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <strong className="font-mono text-base text-slate-950">PNR {booking.pnr}</strong>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${booking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : booking.status === 'TICKETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {flightStatusLabels[booking.status] || booking.status}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-slate-500">{booking.referenceNumber} · {booking.provider}</p>
                              {booking.ticketNumbers?.length ? <p className="mt-1 font-mono text-xs text-emerald-700">تذكرة: {booking.ticketNumbers.join('، ')}</p> : null}
                            </div>
                            <div className="text-left">
                              <p className="font-black text-slate-900">{String(booking.totalAmount)} {booking.currency}</p>
                            </div>
                          </div>
                          {booking.status !== 'CANCELLED' && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {booking.status === 'PNR_CREATED' && (
                                <button type="button" disabled={busy !== null} onClick={() => issueFlightTicket(booking)} className={primaryButton}>
                                  {busy === `ticket-${booking.id}` ? 'جاري الإصدار...' : 'إصدار التذكرة'}
                                </button>
                              )}
                              <button type="button" disabled={busy !== null} onClick={() => cancelFlightBooking(booking)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                                {busy === `cancel-flight-${booking.id}` ? 'جاري الإلغاء...' : 'إلغاء الحجز'}
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                      {!selectedCustomer.flightBookings?.length && <p className="text-sm text-slate-400">لا توجد حجوزات طيران مرتبطة بهذا العميل.</p>}
                    </div>
                  </div>
                </Panel>

                <Panel title="عمليات الفنادق" description="ابحث عن الإقامة، اختر الغرفة، ثم أدِر الحجز من ملف Customer 360.">
                  <form onSubmit={searchHotels} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="المدينة *">
                      <input required className={inputClass} value={hotelSearchForm.city} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, city: e.target.value })} />
                    </Field>
                    <Field label="الدولة *">
                      <input required minLength={2} maxLength={2} className={inputClass} value={hotelSearchForm.country} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, country: e.target.value })} dir="ltr" />
                    </Field>
                    <Field label="تاريخ الدخول *">
                      <input required type="date" className={inputClass} value={hotelSearchForm.checkIn} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, checkIn: e.target.value })} />
                    </Field>
                    <Field label="تاريخ الخروج *">
                      <input required type="date" className={inputClass} value={hotelSearchForm.checkOut} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, checkOut: e.target.value })} />
                    </Field>
                    <Field label="الغرف">
                      <input type="number" min={1} className={inputClass} value={hotelSearchForm.rooms} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, rooms: Number(e.target.value) })} />
                    </Field>
                    <Field label="البالغون">
                      <input type="number" min={1} className={inputClass} value={hotelSearchForm.adults} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, adults: Number(e.target.value) })} />
                    </Field>
                    <Field label="الأطفال">
                      <input type="number" min={0} className={inputClass} value={hotelSearchForm.children} onChange={(e) => setHotelSearchForm({ ...hotelSearchForm, children: Number(e.target.value) })} />
                    </Field>
                    <div className="flex items-end">
                      <button disabled={busy !== null} className={`${primaryButton} w-full`}>
                        {busy === 'search-hotels' ? 'جاري البحث...' : 'البحث عن الفنادق'}
                      </button>
                    </div>
                  </form>

                  {hotelOffers.length > 0 && (
                    <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">بيانات النزيل الرئيسي</h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <Field label="الاسم الأول *">
                            <input required className={inputClass} value={hotelGuestForm.firstName} onChange={(e) => setHotelGuestForm({ ...hotelGuestForm, firstName: e.target.value })} />
                          </Field>
                          <Field label="اسم العائلة *">
                            <input required className={inputClass} value={hotelGuestForm.lastName} onChange={(e) => setHotelGuestForm({ ...hotelGuestForm, lastName: e.target.value })} />
                          </Field>
                          <Field label="البريد الإلكتروني">
                            <input type="email" className={inputClass} value={hotelGuestForm.email} onChange={(e) => setHotelGuestForm({ ...hotelGuestForm, email: e.target.value })} dir="ltr" />
                          </Field>
                        </div>
                      </div>

                      {hotelInsight && <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs leading-6 text-indigo-900">{hotelInsight}</p>}

                      <div className="space-y-4">
                        {hotelOffers.map((offer) => {
                          const activeRoomId = selectedHotelOfferId === offer.id
                            ? selectedHotelRoomId
                            : offer.rooms[0]?.id || '';
                          const activeRoom = offer.rooms.find((room) => room.id === activeRoomId) || offer.rooms[0];
                          const nights = Math.ceil((new Date(offer.checkOut).getTime() - new Date(offer.checkIn).getTime()) / 86_400_000);
                          const total = (activeRoom?.pricePerNight || 0) * nights * offer.requestedRooms;
                          return (
                            <article key={offer.id} className={`overflow-hidden rounded-2xl border ${selectedHotelOfferId === offer.id ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                              <div className="grid md:grid-cols-[220px_1fr]">
                                <div className="grid min-h-48 grid-cols-2 gap-1 bg-slate-100 p-1 md:grid-cols-1">
                                  {offer.images.slice(0, 2).map((image, index) => (
                                    <div key={image} role="img" aria-label={`${offer.hotelName} ${index + 1}`} className="min-h-24 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
                                  ))}
                                </div>
                                <div className="space-y-4 p-5">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <div className="mb-1 text-amber-500" aria-label={`${offer.stars} stars`}>{'★'.repeat(offer.stars)}</div>
                                      <h3 className="text-lg font-black text-slate-950">{offer.hotelName}</h3>
                                      <p className="mt-1 text-xs text-slate-500">{offer.location.address} · {offer.location.city}, {offer.location.country}</p>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-2xl font-black text-indigo-700">{total} {offer.totalPrice.currency}</p>
                                      <p className="text-xs text-slate-400">{nights} ليالٍ · {offer.requestedRooms} غرفة</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {offer.amenities.map((amenity) => <span key={amenity} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{amenity}</span>)}
                                  </div>
                                  <p className="text-xs font-bold text-emerald-700">سياسة الإلغاء: {offer.cancellationPolicy}</p>
                                  <div className="grid items-end gap-3 md:grid-cols-[1fr_auto]">
                                    <Field label="نوع الغرفة">
                                      <select className={inputClass} value={activeRoomId} onChange={(e) => { setSelectedHotelOfferId(offer.id); setSelectedHotelRoomId(e.target.value); }}>
                                        {offer.rooms.map((room) => <option key={room.id} value={room.id}>{room.type} · {room.bedType} · {room.mealPlan} · {room.pricePerNight} USD/ليلة</option>)}
                                      </select>
                                    </Field>
                                    <button
                                      type="button"
                                      disabled={busy !== null || !activeRoomId || !hotelGuestForm.firstName.trim() || !hotelGuestForm.lastName.trim()}
                                      onClick={() => createHotelBooking(offer, activeRoomId)}
                                      className={primaryButton}
                                    >
                                      {busy === 'book-hotel' && selectedHotelOfferId === offer.id ? 'جاري التأكيد...' : 'اختيار وحجز الغرفة'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="mb-3 text-sm font-black text-slate-900">فنادق العميل في Customer 360</h3>
                    <div className="space-y-4">
                      {selectedCustomer.hotelBookings?.map((booking) => (
                        <article key={booking.id} className="overflow-hidden rounded-2xl border border-slate-200">
                          <div className="grid md:grid-cols-[180px_1fr]">
                            <div role="img" aria-label={booking.hotelName} className="min-h-40 bg-slate-200 bg-cover bg-center" style={{ backgroundImage: booking.hotelImages?.[0] ? `url(${booking.hotelImages[0]})` : undefined }} />
                            <div className="p-5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="text-amber-500">{'★'.repeat(booking.stars || 0)}</div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <h4 className="font-black text-slate-950">{booking.hotelName}</h4>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${booking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{booking.status === 'CANCELLED' ? 'ملغي' : 'مؤكد'}</span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">{booking.referenceNumber} · تأكيد {booking.hotelConfirmationNumber}</p>
                                  <p className="mt-1 text-xs text-slate-500">{new Date(booking.checkIn).toLocaleDateString('ar')} — {new Date(booking.checkOut).toLocaleDateString('ar')}</p>
                                  <p className="mt-1 text-xs text-slate-500">{booking.roomDetails.selectedRoom.type} · {booking.roomDetails.roomCount} غرفة · {booking.guests.length} نزيل</p>
                                </div>
                                <p className="text-lg font-black text-indigo-700">{String(booking.totalAmount)} {booking.currency}</p>
                              </div>

                              {booking.status !== 'CANCELLED' && editingHotelId !== booking.id && (
                                <div className="mt-4 flex gap-2">
                                  <button type="button" onClick={() => beginHotelEdit(booking)} className={primaryButton}>تعديل الحجز</button>
                                  <button type="button" disabled={busy !== null || !hotelCancellationReason.trim()} onClick={() => cancelHotelBooking(booking)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-50">إلغاء الحجز</button>
                                </div>
                              )}

                              {editingHotelId === booking.id && booking.status !== 'CANCELLED' && (
                                <form onSubmit={(event) => updateHotelBooking(event, booking)} className="mt-5 space-y-4 rounded-xl bg-slate-50 p-4">
                                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    <Field label="الدخول">
                                      <input required type="date" className={inputClass} value={hotelEditForm.checkIn} onChange={(e) => setHotelEditForm({ ...hotelEditForm, checkIn: e.target.value })} />
                                    </Field>
                                    <Field label="الخروج">
                                      <input required type="date" className={inputClass} value={hotelEditForm.checkOut} onChange={(e) => setHotelEditForm({ ...hotelEditForm, checkOut: e.target.value })} />
                                    </Field>
                                    <Field label="الغرفة">
                                      <select className={inputClass} value={hotelEditForm.roomId} onChange={(e) => setHotelEditForm({ ...hotelEditForm, roomId: e.target.value })}>
                                        {booking.roomDetails.availableRooms.map((room) => <option key={room.id} value={room.id}>{room.type} · {room.pricePerNight} USD</option>)}
                                      </select>
                                    </Field>
                                    <Field label="عدد الغرف">
                                      <input type="number" min={1} className={inputClass} value={hotelEditForm.roomCount} onChange={(e) => setHotelEditForm({ ...hotelEditForm, roomCount: Number(e.target.value) })} />
                                    </Field>
                                    <Field label="البالغون">
                                      <input type="number" min={1} className={inputClass} value={hotelEditForm.adults} onChange={(e) => setHotelEditForm({ ...hotelEditForm, adults: Number(e.target.value) })} />
                                    </Field>
                                    <Field label="الأطفال">
                                      <input type="number" min={0} className={inputClass} value={hotelEditForm.children} onChange={(e) => setHotelEditForm({ ...hotelEditForm, children: Number(e.target.value) })} />
                                    </Field>
                                  </div>
                                  <Field label="سبب الإلغاء عند الحاجة">
                                    <input className={inputClass} value={hotelCancellationReason} onChange={(e) => setHotelCancellationReason(e.target.value)} />
                                  </Field>
                                  <div className="flex flex-wrap gap-2">
                                    <button disabled={busy !== null} className={primaryButton}>{busy === `update-hotel-${booking.id}` ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
                                    <button type="button" onClick={() => setEditingHotelId('')} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600">إغلاق التفاصيل</button>
                                    <button type="button" disabled={busy !== null || !hotelCancellationReason.trim()} onClick={() => cancelHotelBooking(booking)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-extrabold text-rose-700">إلغاء الحجز</button>
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                      {!selectedCustomer.hotelBookings?.length && <p className="text-sm text-slate-400">لا توجد حجوزات فنادق مرتبطة بهذا العميل.</p>}
                    </div>
                  </div>
                </Panel>

                <Panel title="إدارة باقات السفر" description="أنشئ الباقات وعدّل تفاصيلها وسعتها قبل ربطها بحجوزات الحج والعمرة.">
                  <form onSubmit={savePackage} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="اسم الباقة *"><input required className={inputClass} value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} /></Field>
                    <Field label="النوع"><select className={inputClass} value={packageForm.type} onChange={(e) => setPackageForm({ ...packageForm, type: e.target.value })}><option value="TOURISM">سياحة</option><option value="UMRAH">عمرة</option><option value="HAJJ">حج</option><option value="SPECIAL">خاصة</option></select></Field>
                    <Field label="الموسم"><input className={inputClass} value={packageForm.season} onChange={(e) => setPackageForm({ ...packageForm, season: e.target.value })} /></Field>
                    <Field label="الحالة"><select className={inputClass} value={packageForm.status} onChange={(e) => setPackageForm({ ...packageForm, status: e.target.value })}><option value="DRAFT">مسودة</option><option value="ACTIVE">نشطة</option></select></Field>
                    <Field label="البداية"><input required type="date" className={inputClass} value={packageForm.startDate} onChange={(e) => setPackageForm({ ...packageForm, startDate: e.target.value })} /></Field>
                    <Field label="النهاية"><input required type="date" className={inputClass} value={packageForm.endDate} onChange={(e) => setPackageForm({ ...packageForm, endDate: e.target.value })} /></Field>
                    <Field label="السعر"><input type="number" min={0} className={inputClass} value={packageForm.basePrice} onChange={(e) => setPackageForm({ ...packageForm, basePrice: Number(e.target.value) })} /></Field>
                    <Field label="السعة"><input type="number" min={1} className={inputClass} value={packageForm.capacity} onChange={(e) => setPackageForm({ ...packageForm, capacity: Number(e.target.value) })} /></Field>
                    <Field label="الوصف"><input className={inputClass} value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} /></Field>
                    <div className="flex items-end gap-2"><button disabled={busy !== null} className={primaryButton}>{editingPackageId ? 'حفظ التعديل' : 'إنشاء الباقة'}</button>{editingPackageId && <button type="button" onClick={() => setEditingPackageId('')} className="rounded-xl border px-3 py-2 text-sm">إلغاء</button>}</div>
                  </form>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {packages.map((pkg) => <article key={pkg.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><h4 className="font-black">{pkg.name}</h4><p className="text-xs text-slate-500">{pkg.type} · {pkg.durationDays} أيام · {pkg.status}</p></div><strong>{String(pkg.basePrice)} {pkg.currency}</strong></div><div className="mt-3 h-2 overflow-hidden rounded bg-slate-100"><div className="h-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, (pkg.remainingSlots / pkg.capacity) * 100))}%` }} /></div><p className="mt-2 text-xs">المتاح {pkg.remainingSlots} من {pkg.capacity} · الحجوزات {pkg.capacity - pkg.remainingSlots}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => editPackage(pkg)} className={primaryButton}>تعديل التفاصيل</button><button type="button" onClick={() => changePackageCapacity(pkg, pkg.capacity + 10)} className="rounded-xl border px-3 py-2 text-sm font-bold">زيادة السعة +10</button></div></article>)}
                    {!packages.length && <p className="text-sm text-slate-400">لا توجد باقات بعد.</p>}
                  </div>
                </Panel>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
