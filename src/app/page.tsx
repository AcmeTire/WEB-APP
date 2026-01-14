export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Acme Tire</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and manage repair orders.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">New repair order</div>
            <div className="mt-1 text-sm text-gray-600">
              Phone-first intake. You can add VIN later.
            </div>
          </div>
          <a
            className="inline-flex items-center justify-center rounded-md bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:bg-[#C9A534]"
            href="/repair-orders/new"
          >
            New Repair Order
          </a>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">All repair orders</div>
            <div className="mt-1 text-sm text-gray-600">
              View and edit existing repair orders.
            </div>
          </div>
          <a
            className="inline-flex items-center justify-center rounded-md bg-[#D4AF37] px-5 py-3 text-sm font-medium text-black hover:bg-[#C9A534]"
            href="/repair-orders"
          >
            All Repair Orders
          </a>
        </div>
      </div>
    </div>
  );
}
