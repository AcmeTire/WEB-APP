import Image from 'next/image';
import logo from '../../acme tire x dyligent.png';
import GlobalSearch from '@/components/global-search';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-8">
      <div className="flex flex-col items-center text-center">
        <Image src={logo} alt="Acme Tire" className="h-14 w-auto" priority />
      </div>

      <div className="relative z-50">
        <GlobalSearch placeholder="Search customers, vehicles, repair orders…" className="w-full" />
      </div>

      <p className="text-center text-base" style={{ color: '#d7b73f' }}>
        Create and manage repair orders.
      </p>

      <a
        className="group relative z-0 mt-6 block w-full rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-8 py-6 text-center backdrop-blur transition hover:bg-[#D4AF37]/18 active:bg-[#D4AF37]/22"
        href="/repair-orders/new"
      >
        <div className="text-2xl font-semibold" style={{ color: '#d7b73f' }}>
          New Repair Order
        </div>
        <div
          className="mt-3 overflow-hidden text-sm opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{ color: '#d7b73f' }}
        >
          Phone-first intake. You can add VIN later.
        </div>
      </a>

      <a
        className="group relative z-0 block w-full rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/12 px-8 py-6 text-center backdrop-blur transition hover:bg-[#D4AF37]/18 active:bg-[#D4AF37]/22"
        href="/repair-orders"
      >
        <div className="text-2xl font-semibold" style={{ color: '#d7b73f' }}>
          All Repair Orders
        </div>
        <div
          className="mt-3 overflow-hidden text-sm opacity-0 transition-all duration-200 group-hover:opacity-100"
          style={{ color: '#d7b73f' }}
        >
          View and edit existing repair orders.
        </div>
      </a>

      <div className="mt-auto pb-6 text-center text-4xl font-semibold text-slate-800">
        "Lets Keep Having Fun"
      </div>
    </div>
  );
}
