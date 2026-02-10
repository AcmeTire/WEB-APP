 'use client';

 import { use, useEffect, useMemo, useState } from 'react';
 import type { RepairOrderStatus } from '@/types';
 import { useRepairOrder } from '@/hooks/use-repair-order';
 import { useVehicle } from '@/hooks/use-vehicle';
 import { useUpdateVehicle } from '@/hooks/use-update-vehicle';
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
  'Repair Approved',
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
  const vehicleQ = useVehicle(data?.vehicle_id || '');
  const updateVehicle = useUpdateVehicle();

  const [isEditing, setIsEditing] = useState(false);

  const [status, setStatus] = useState<RepairOrderStatus>('New');
  const [serviceType, setServiceType] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [estimatedTotal, setEstimatedTotal] = useState<string>('');
  const [finalChargeTotal, setFinalChargeTotal] = useState<string>('');
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>('');
  const [vin, setVin] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');

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

  const vehicleVin = vehicleQ.data?.data?.vin || '';
  const vehicleLicensePlate = vehicleQ.data?.data?.license_plate || '';

  useEffect(() => {
    if (isEditing) return;
    setVin(vehicleVin);
    setLicensePlate(vehicleLicensePlate);
  }, [isEditing, vehicleLicensePlate, vehicleVin]);

  const onCancel = () => {
    if (data) {
      setStatus(data.status);
      setServiceType(data.service_type || '');
      setJobDescription(data.job_description || '');
      setNote(data.note || '');
      setEstimatedTotal(data.estimated_total !== undefined ? String(data.estimated_total) : '');
      setFinalChargeTotal(data.final_charge_total !== undefined ? String(data.final_charge_total) : '');
      setEstimatedCompletion(isoToDatetimeLocal(data.estimated_completion || ''));
    }
    setVin(vehicleVin);
    setLicensePlate(vehicleLicensePlate);
    setIsEditing(false);
  };

  const onSave = async () => {
    const nextVin = vin.trim();
    const didChangeVin = nextVin !== (vehicleVin || '');

    const nextPlate = licensePlate.trim();
    const didChangePlate = nextPlate !== (vehicleLicensePlate || '');

    if (didChangeVin) {
      if (!nextVin) {
        throw new Error('VIN is required');
      }
      await checkInVin.mutateAsync({ repair_order_id: id, vin: nextVin });
    }

    if (didChangePlate) {
      if (data?.vehicle_id) {
        await updateVehicle.mutateAsync({
          id: data.vehicle_id,
          license_plate: nextPlate || undefined,
        });
      }
    }

    await update.mutateAsync({
      id,
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
    });
    setIsEditing(false);
  };

  const canSave = useMemo(() => {
    if (!data) return false;
    const nextVin = vin.trim();
    const didChangeVin = nextVin !== (vehicleVin || '');

    const nextPlate = licensePlate.trim();
    const didChangePlate = nextPlate !== (vehicleLicensePlate || '');
    return (
      status !== data.status ||
      (serviceType || '') !== (data.service_type || '') ||
      (jobDescription || '') !== (data.job_description || '') ||
      (note || '') !== (data.note || '') ||
      (estimatedTotal.trim() ? Number(estimatedTotal) : undefined) !== data.estimated_total ||
      (finalChargeTotal.trim() ? Number(finalChargeTotal) : undefined) !== data.final_charge_total ||
      datetimeLocalToIso(estimatedCompletion) !== (data.estimated_completion || '') ||
      (didChangeVin && Boolean(nextVin)) ||
      didChangePlate
    );
  }, [
    data,
    estimatedCompletion,
    estimatedTotal,
    finalChargeTotal,
    jobDescription,
    licensePlate,
    note,
    serviceType,
    status,
    vehicleLicensePlate,
    vehicleVin,
    vin,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#d7b73f' }}>
            Repair Order
          </h1>
          <div className="mt-1 text-sm text-slate-300">ID: {id}</div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <button
              className="rounded-full bg-[#d7b73f] px-4 py-2 text-sm font-semibold text-black hover:bg-[#d7b73f]/90"
              onClick={() => (isEditing ? onCancel() : setIsEditing(true))}
              type="button"
              disabled={!data}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {isEditing ? (
              <button
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                onClick={onSave}
                type="button"
                disabled={!canSave || update.isPending}
              >
                {update.isPending ? 'Saving…' : 'Save'}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-300">Loading…</div>
      ) : isError ? (
        <div className="text-sm text-red-200">{(error as any)?.message || 'Failed to load repair order.'}</div>
      ) : !data ? (
        <div className="text-sm text-slate-300">Repair order not found.</div>
      ) : (
        <div className="surface p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                Status
              </div>
              <select
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                value={status}
                onChange={(e) => setStatus(e.target.value as RepairOrderStatus)}
                disabled={!isEditing}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                Service type
              </div>
              <input
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                readOnly={!isEditing}
              />
              <div className="mt-1 text-xs text-slate-400">Vehicle ID: {data.vehicle_id}</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
              Job description
            </div>
            <textarea
              className={
                'mt-1 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-100 outline-none ' +
                (isEditing ? 'focus:border-[#d7b73f]/50' : 'opacity-90')
              }
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              readOnly={!isEditing}
            />
          </div>

          <div>
            <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
              Note
            </div>
            <textarea
              className={
                'mt-1 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-100 outline-none ' +
                (isEditing ? 'focus:border-[#d7b73f]/50' : 'opacity-90')
              }
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              readOnly={!isEditing}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                Estimated Total
              </div>
              <input
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                type="number"
                step="0.01"
                min="0"
                value={estimatedTotal}
                onChange={(e) => setEstimatedTotal(e.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                Final Charge Total
              </div>
              <input
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                type="number"
                step="0.01"
                min="0"
                value={finalChargeTotal}
                onChange={(e) => setFinalChargeTotal(e.target.value)}
                readOnly={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                Estimated Completion
              </div>
              <input
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                type="datetime-local"
                value={estimatedCompletion}
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                readOnly={!isEditing}
              />
            </div>
            <div />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                VIN
              </div>
              <input
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                readOnly={!isEditing}
                placeholder={vehicleQ.isLoading ? 'Loading…' : '—'}
              />
              {checkInVin.isError ? <div className="mt-2 text-sm text-red-200">Failed to save VIN</div> : null}
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: '#d7b73f' }}>
                License plate
              </div>
              <input
                className="mt-1 w-full rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-slate-100 outline-none disabled:opacity-50"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                readOnly={!isEditing}
                placeholder={vehicleQ.isLoading ? 'Loading…' : '—'}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <a className="text-sm font-medium text-slate-300 hover:text-white" href="/repair-orders">
              Back to list
            </a>
            <div className="flex items-center gap-3">
              {update.isError ? <div className="text-sm text-red-200">Failed to save</div> : null}
              {update.isSuccess ? <div className="text-sm text-slate-300">Saved</div> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
