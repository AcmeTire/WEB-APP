export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Vehicle</h1>
        <div className="mt-1 text-sm text-slate-300">ID: {id}</div>
      </div>

      <div className="surface p-4">
        <div className="text-sm text-slate-300">Vehicle detail page coming soon.</div>
      </div>
    </div>
  );
}
