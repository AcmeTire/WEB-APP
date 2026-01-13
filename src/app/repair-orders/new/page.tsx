export default function NewRepairOrderPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Create Repair Order</h1>
      <p className="text-sm text-gray-600">
        Flow:
        VIN search → if exists use vehicle → else create vehicle → then create repair order.
      </p>
    </div>
  );
}
