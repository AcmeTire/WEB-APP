export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Auto Repair CRM</h1>
      <p className="text-sm text-gray-600">
        Use the navigation to view active repair orders or create a new one.
      </p>
      <div className="flex gap-3">
        <a
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          href="/dashboard"
        >
          Go to Dashboard
        </a>
        <a
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium"
          href="/repair-orders"
        >
          View Repair Orders
        </a>
      </div>
    </div>
  );
}
