 'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ActiveRepairOrderItem, RepairOrderStatus } from '@/types';
import { useRepairOrdersEnriched } from '@/hooks/use-repair-orders-enriched';
import { useUpdateRepairOrder } from '@/hooks/use-update-repair-order';
import { useCheckInVin } from '@/hooks/use-check-in-vin';
import { useUpdateVehicle } from '@/hooks/use-update-vehicle';
import GlobalSearch from '@/components/global-search';

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

const statusBadgeClasses = (status: RepairOrderStatus) => {
  switch (status) {
    case 'New':
      return 'bg-blue-500/15 text-blue-200 ring-blue-400/25';
    case 'Scheduled':
    case 'Dropped Off':
      return 'bg-purple-500/15 text-purple-200 ring-purple-400/25';
    case 'Diagnosing':
    case 'Waiting Approval':
    case 'In Progress':
      return 'bg-amber-500/15 text-amber-200 ring-amber-400/25';
    case 'Ready For Pickup':
    case 'Completed':
      return 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/25';
    default:
      return 'bg-slate-500/15 text-slate-200 ring-slate-400/25';
  }
};

const STATUS_OPTIONS: Array<RepairOrderStatus | 'All'> = [
  'All',
  'New',
  'Scheduled',
  'Dropped Off',
  'Diagnosing',
  'Waiting Approval',
  'In Progress',
  'Ready For Pickup',
  'Completed',
];

const RO_STATUS_OPTIONS: RepairOrderStatus[] = [
  'New',
  'Scheduled',
  'Dropped Off',
  'Diagnosing',
  'Waiting Approval',
  'In Progress',
  'Ready For Pickup',
  'Completed',
];

const RepairOrderRow = ({
  item,
  formatVehicleDisplay,
}: {
  item: ActiveRepairOrderItem;
  formatVehicleDisplay: (vehicle: ActiveRepairOrderItem['vehicle']) => string;
}) => {
  const update = useUpdateRepairOrder();
  const checkInVin = useCheckInVin();
  const updateVehicle = useUpdateVehicle();

  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<RepairOrderStatus>(item.repairOrder.status);
  const [serviceType, setServiceType] = useState(item.repairOrder.service_type || '');
  const [jobDescription, setJobDescription] = useState(item.repairOrder.job_description || '');
  const [note, setNote] = useState(item.repairOrder.note || '');
  const [estimatedTotal, setEstimatedTotal] = useState(
    item.repairOrder.estimated_total !== undefined ? String(item.repairOrder.estimated_total) : ''
  );
  const [finalChargeTotal, setFinalChargeTotal] = useState(
    item.repairOrder.final_charge_total !== undefined ? String(item.repairOrder.final_charge_total) : ''
  );
  const [estimatedCompletion, setEstimatedCompletion] = useState(
    isoToDatetimeLocal(item.repairOrder.estimated_completion || '')
  );
  const [vin, setVin] = useState(item.vehicle?.vin || '');
  const [licensePlate, setLicensePlate] = useState(item.vehicle?.license_plate || '');

  const customerName = item.customer
    ? `${item.customer.first_name} ${item.customer.last_name}`.trim()
    : '';

  const vehicleDisplay = formatVehicleDisplay(item.vehicle);
  const vehicleVin = item.vehicle?.vin ? `VIN: ${item.vehicle.vin}` : 'VIN: —';
  const vehiclePlate = item.vehicle?.license_plate ? `Plate: ${item.vehicle.license_plate}` : 'Plate: —';

  const canSave =
    status !== item.repairOrder.status ||
    (serviceType || '') !== (item.repairOrder.service_type || '') ||
    (jobDescription || '') !== (item.repairOrder.job_description || '') ||
    (note || '') !== (item.repairOrder.note || '') ||
    (estimatedTotal.trim() ? Number(estimatedTotal) : undefined) !== item.repairOrder.estimated_total ||
    (finalChargeTotal.trim() ? Number(finalChargeTotal) : undefined) !== item.repairOrder.final_charge_total ||
    datetimeLocalToIso(estimatedCompletion) !== (item.repairOrder.estimated_completion || '');

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-12 gap-3 text-sm">
        <div className="col-span-2">
          <div className="relative">
            <select
              className={`w-full appearance-none rounded-full px-3 py-2 pr-8 text-xs font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${statusBadgeClasses(
                status
              )}`}
              value={status}
              disabled={update.isPending}
              onChange={(e) => {
                const next = e.target.value as RepairOrderStatus;
                setStatus(next);
                update.mutate({ id: item.repairOrder.id, status: next });
              }}
            >
              {RO_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 opacity-80"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {update.isPending ? (
            <div className="mt-1 text-xs text-slate-400">Saving…</div>
          ) : update.isError ? (
            <div className="mt-1 text-xs text-red-400">Save failed</div>
          ) : null}
        </div>
        <div className="col-span-4">
          {item.vehicle?.id ? (
            <Link href={`/vehicles/${encodeURIComponent(item.vehicle.id)}`} className="block hover:opacity-95">
              <div className="font-medium text-slate-100">{vehicleDisplay || 'Unknown vehicle'}</div>
              <div className="text-xs text-slate-400">
                {vehicleVin} {' · '} {vehiclePlate}
              </div>
            </Link>
          ) : (
            <>
              <div className="font-medium text-slate-100">{vehicleDisplay || 'Unknown vehicle'}</div>
              <div className="text-xs text-slate-400">
                {vehicleVin} {' · '} {vehiclePlate}
              </div>
            </>
          )}
        </div>
        <div className="col-span-3">
          {item.customer?.id ? (
            <Link href={`/customers/${encodeURIComponent(item.customer.id)}`} className="block hover:opacity-95">
              <div className="font-medium text-slate-100">{customerName || 'Unknown customer'}</div>
              <div className="text-xs text-slate-400">{item.customer?.phone || ''}</div>
            </Link>
          ) : (
            <>
              <div className="font-medium text-slate-100">{customerName || 'Unknown customer'}</div>
              <div className="text-xs text-slate-400">{item.customer?.phone || ''}</div>
            </>
          )}
        </div>
        <div className="col-span-2">
          <div className="text-slate-100">{item.repairOrder.service_type || ''}</div>
        </div>
        <div className="col-span-1 flex justify-end gap-3">
          <button
            className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/15 px-4 py-1.5 text-sm font-semibold text-[#F6E7B7] backdrop-blur hover:bg-[#D4AF37]/22 active:bg-[#D4AF37]/28"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Close' : 'Open'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-300">Status</div>
              <div className="relative mt-1">
                <select
                  className={`w-full appearance-none rounded-full px-4 py-2 pr-9 text-sm font-medium ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 ${statusBadgeClasses(
                    status
                  )}`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RepairOrderStatus)}
                >
                  {RO_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 opacity-80"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-300">Service type</div>
              <div className="mt-1 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
                <input
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-300">Job description</div>
            <div className="mt-1 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-3 backdrop-blur">
              <textarea
                className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-slate-300">Note</div>
            <div className="mt-1 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-3 backdrop-blur">
              <textarea
                className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-300">Estimated Total</div>
              <div className="mt-1 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
                <input
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedTotal}
                  onChange={(e) => setEstimatedTotal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-300">Final Charge Total</div>
              <div className="mt-1 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
                <input
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  type="number"
                  step="0.01"
                  min="0"
                  value={finalChargeTotal}
                  onChange={(e) => setFinalChargeTotal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-300">Estimated Completion</div>
              <div className="mt-1 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
                <input
                  className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                  type="datetime-local"
                  value={estimatedCompletion}
                  onChange={(e) => setEstimatedCompletion(e.target.value)}
                />
              </div>
            </div>
            <div />
          </div>

          <div className="space-y-2 rounded-lg border border-white/10 bg-white/3 p-3 backdrop-blur">
            <div className="text-xs font-medium text-slate-300">VIN / License plate</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-300">VIN</div>
                  <div className="mt-1 w-full rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
                    <input
                      className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      placeholder="Enter VIN"
                    />
                  </div>
                </div>
                <button
                  className="rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-black hover:bg-[#C9A534] disabled:opacity-40"
                  disabled={!vin.trim() || checkInVin.isPending}
                  onClick={() => {
                    const nextVin = vin.trim();
                    checkInVin.mutate(
                      { repair_order_id: item.repairOrder.id, vin: nextVin },
                      {
                        onSuccess: (data) => {
                          setVin(data.vehicle.vin || nextVin);
                          setLicensePlate(data.vehicle.license_plate || licensePlate);
                        },
                      }
                    );
                  }}
                >
                  {checkInVin.isPending ? 'Saving…' : 'Save VIN'}
                </button>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-300">License plate</div>
                  <div className="mt-1 w-full rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
                    <input
                      className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="Enter plate"
                    />
                  </div>
                </div>
                <button
                  className="rounded-full bg-[#D4AF37] px-5 py-2 text-sm font-semibold text-black hover:bg-[#C9A534] disabled:opacity-40"
                  disabled={!item.vehicle?.id || updateVehicle.isPending}
                  onClick={() =>
                    updateVehicle.mutate(
                      { id: item.vehicle!.id, license_plate: licensePlate.trim() || undefined },
                      {
                        onSuccess: (data) => {
                          setLicensePlate(data.data.license_plate || '');
                        },
                      }
                    )
                  }
                >
                  {updateVehicle.isPending ? 'Saving…' : 'Save plate'}
                </button>
              </div>
            </div>

            {checkInVin.isError ? <div className="text-sm text-red-400">Failed to save VIN</div> : null}
            {checkInVin.isSuccess ? (
              <div className="text-sm text-emerald-400">
                {checkInVin.data.action === 'linked_existing_vehicle'
                  ? 'VIN matched an existing vehicle. Repair order linked.'
                  : 'VIN saved to vehicle.'}
              </div>
            ) : null}
            {updateVehicle.isError ? <div className="text-sm text-red-400">Failed to save plate</div> : null}
            {updateVehicle.isSuccess ? <div className="text-sm text-emerald-400">Plate saved</div> : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            {update.isError ? <div className="text-sm text-red-400">Failed to save</div> : null}
            {update.isSuccess ? <div className="text-sm text-emerald-400">Saved</div> : null}
            <button
              className="rounded-full bg-[#D4AF37] px-6 py-2 text-sm font-semibold text-black hover:bg-[#C9A534] disabled:opacity-40"
              disabled={!canSave || update.isPending}
              onClick={() =>
                update.mutate({
                  id: item.repairOrder.id,
                  status,
                  service_type: serviceType,
                  job_description: jobDescription,
                  note,
                  estimated_total: estimatedTotal.trim()
                    ? Number.isFinite(Number(estimatedTotal))
                      ? Number(estimatedTotal)
                      : undefined
                    : undefined,
                  final_charge_total: finalChargeTotal.trim()
                    ? Number.isFinite(Number(finalChargeTotal))
                      ? Number(finalChargeTotal)
                      : undefined
                    : undefined,
                  estimated_completion: datetimeLocalToIso(estimatedCompletion) || undefined,
                })
              }
            >
              {update.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default function RepairOrdersPage() {
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('All');
  const queryStatus = status === 'All' ? undefined : status;
  const { data, isLoading, isError, error } = useRepairOrdersEnriched({
    status: queryStatus,
    page: 1,
    perPage: 50,
  });

  const rows = useMemo(() => (data?.data || []) as ActiveRepairOrderItem[], [data]);

  const formatVehicleDisplay = (vehicle: ActiveRepairOrderItem['vehicle']) => {
    if (!vehicle) return '';
    return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Repair Orders</h1>
          <p className="mt-1 text-sm text-slate-300">Browse and manage repair orders</p>
        </div>
        <a
          className="rounded-full bg-[#D4AF37] px-6 py-2 text-sm font-semibold text-black hover:bg-[#C9A534]"
          href="/repair-orders/new"
        >
          New Repair Order
        </a>
      </div>

      <GlobalSearch placeholder="Search customers, vehicles, repair orders…" />

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-300" htmlFor="status">
          Status
        </label>
        <div className="rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/8 px-4 py-2 backdrop-blur">
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="bg-transparent text-sm text-slate-100 focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="surface p-4 text-sm text-slate-300">Loading…</div>
      ) : isError ? (
        <div className="surface p-4 text-sm text-red-200">
          {(error as any)?.message || 'Failed to load repair orders'}
        </div>
      ) : rows.length === 0 ? (
        <div className="surface p-6">
          <div className="text-sm text-slate-300">No repair orders found.</div>
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-white/3 px-4 py-3 text-xs font-medium text-slate-300">
            <div className="col-span-2">Status</div>
            <div className="col-span-4">Vehicle</div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-1 text-right">Edit</div>
          </div>
          <div className="divide-y divide-white/10">
            {rows.map((item) => (
              <RepairOrderRow
                key={item.repairOrder.id}
                item={item}
                formatVehicleDisplay={formatVehicleDisplay}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
