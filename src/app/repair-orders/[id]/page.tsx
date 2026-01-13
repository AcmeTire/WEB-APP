export default async function RepairOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Repair Order</h1>
      <p className="text-sm text-gray-600">ID: {id}</p>
      <p className="text-sm text-gray-600">
        This page will display repair order details + allow editing status and notes.
      </p>
    </div>
  );
}
