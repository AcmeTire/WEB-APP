 'use client';

 import { use, useEffect, useMemo, useState } from 'react';
 import type { RepairOrderStatus } from '@/types';
 import { useRepairOrder } from '@/hooks/use-repair-order';
 import { useUpdateRepairOrder } from '@/hooks/use-update-repair-order';
 import { useCheckInVin } from '@/hooks/use-check-in-vin';

 const isoToDatetimeLocal = (iso: string) => {
   if (!iso) return '';
   const d = new Date(iso);
   if (Number.isNaN(d.getTime())) return '';
   const pad = (n: number) => String(n).padStart(2, '0');
   const yyyy = d.getFullYear();
   const mm = pad(d.getMonth() + 1);
   const dd = pad(d.getDate());
   const hh = pad(d.getHours());
   const mi = pad(d.getMinutes());
   return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
 };

 const datetimeLocalToIso = (value: string) => {
   if (!value) return '';
   const d = new Date(value);
   if (Number.isNaN(d.getTime())) return '';
   return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
 };

const STATUS_OPTIONS: RepairOrderStatus[] = [
  'New',
  'Scheduled',
  'Dropped Off',
  'Diagnosing',
  'Waiting Approval',
  'In Progress',
  'Ready For Pickup',
  'Completed',
];

export default function RepairOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useRepairOrder(id);
  const update = useUpdateRepairOrder();
  const checkInVin = useCheckInVin();

  const [status, setStatus] = useState<RepairOrderStatus>('New');
  const [serviceType, setServiceType] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [estimatedTotal, setEstimatedTotal] = useState<string>('');
  const [finalChargeTotal, setFinalChargeTotal] = useState<string>('');
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>('');
  const [vin, setVin] = useState<string>('');

  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setServiceType(data.service_type || '');
      setJobDescription(data.job_description || '');
      setNote(data.note || '');
      setEstimatedTotal(data.estimated_total !== undefined ? String(data.estimated_total) : '');
      setFinalChargeTotal(data.final_charge_total !== undefined ? String(data.final_charge_total) : '');
      setEstimatedCompletion(isoToDatetimeLocal(data.estimated_completion || ''));
    }
  }, [data]);

  const canSave = useMemo(() => {
    if (!data) return false;
    return (
      status !== data.status ||
      (serviceType || '') !== (data.service_type || '') ||
      (jobDescription || '') !== (data.job_description || '') ||
      (note || '') !== (data.note || '') ||
      (estimatedTotal.trim() ? Number(estimatedTotal) : undefined) !== data.estimated_total ||
      (finalChargeTotal.trim() ? Number(finalChargeTotal) : undefined) !== data.final_charge_total ||
      datetimeLocalToIso(estimatedCompletion) !== (data.estimated_completion || '')
    );
  }, [data, estimatedCompletion, estimatedTotal, finalChargeTotal, jobDescription, note, serviceType, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Repair Order</h1>
        <div className="mt-1 text-sm text-gray-600">ID: {id}</div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">Loading…</div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {(error as any)?.message || 'Failed to load repair order'}
        </div>
      ) : !data ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">Not found.</div>
      ) : (
        <div className="rounded-lg border bg-white p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-600">Status</div>
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as RepairOrderStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600">Service type</div>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
              <div className="mt-1 text-xs text-gray-500">Vehicle ID: {data.vehicle_id}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600">Job description</div>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600">Note</div>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-600">Estimated Total</div>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                type="number"
                step="0.01"
                min="0"
                value={estimatedTotal}
                onChange={(e) => setEstimatedTotal(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-600">Final Charge Total</div>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                type="number"
                step="0.01"
                min="0"
                value={finalChargeTotal}
                onChange={(e) => setFinalChargeTotal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-600">Estimated Completion</div>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                type="datetime-local"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
              />
            </div>
            <div />
          </div>

          <div className="rounded-md border bg-gray-50 p-4 space-y-3">
            <div className="text-sm font-medium text-gray-900">Check-in / Add VIN</div>
            <div className="text-xs text-gray-600">
              Enter VIN when the vehicle is physically present. If that VIN already exists in CRM, this will re-link the
              repair order to the existing vehicle. Otherwise it saves the VIN onto the current vehicle.
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <div className="text-xs font-medium text-gray-600">VIN</div>
                <input
                  className="mt-1 w-80 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="Enter VIN"
                />
              </div>
              <button
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                disabled={!vin.trim() || checkInVin.isPending}
                onClick={() => checkInVin.mutate({ repair_order_id: id, vin })}
              >
                {checkInVin.isPending ? 'Saving…' : 'Save VIN'}
              </button>
            </div>
            {checkInVin.isError ? (
              <div className="text-sm text-red-700">Failed to save VIN</div>
            ) : null}
            {checkInVin.isSuccess ? (
              <div className="text-sm text-emerald-700">
                {checkInVin.data.action === 'linked_existing_vehicle'
                  ? 'VIN matched an existing vehicle. Repair order linked.'
                  : 'VIN saved to vehicle.'}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <a className="text-sm font-medium text-gray-700 hover:underline" href="/repair-orders">
              Back to list
            </a>
            <div className="flex items-center gap-3">
              {update.isError ? (
                <div className="text-sm text-red-700">Failed to save</div>
              ) : null}
              {update.isSuccess ? (
                <div className="text-sm text-emerald-700">Saved</div>
              ) : null}
              <button
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                disabled={!canSave || update.isPending}
                onClick={() =>
                  update.mutate({
                    id,
                    status,
                    service_type: serviceType,
                    job_description: jobDescription,
                    note,
                    estimated_total: estimatedTotal.trim() ? (Number.isFinite(Number(estimatedTotal)) ? Number(estimatedTotal) : undefined) : undefined,
                    final_charge_total: finalChargeTotal.trim()
                      ? (Number.isFinite(Number(finalChargeTotal)) ? Number(finalChargeTotal) : undefined)
                      : undefined,
                    estimated_completion: datetimeLocalToIso(estimatedCompletion) || undefined,
                  })
                }
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
