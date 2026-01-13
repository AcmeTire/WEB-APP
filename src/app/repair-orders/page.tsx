export default function RepairOrdersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Repair Orders</h1>
        <a
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          href="/repair-orders/new"
        >
          New Repair Order
        </a>
      </div>
      <p className="text-sm text-gray-600">
        This will show all repair orders with filters and quick links.
      </p>
    </div>
  );
}
