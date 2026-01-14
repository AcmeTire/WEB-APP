 'use client';

 import { useMemo, useState } from 'react';
 import type { ActiveRepairOrderItem, RepairOrderStatus } from '@/types';
 import { useRepairOrdersEnriched } from '@/hooks/use-repair-orders-enriched';
 import { useUpdateRepairOrder } from '@/hooks/use-update-repair-order';
 import { useCheckInVin } from '@/hooks/use-check-in-vin';

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

   const [expanded, setExpanded] = useState(false);
   const [status, setStatus] = useState<RepairOrderStatus>(item.repairOrder.status);
   const [serviceType, setServiceType] = useState(item.repairOrder.service_type || '');
   const [jobDescription, setJobDescription] = useState(item.repairOrder.job_description || '');
   const [note, setNote] = useState(item.repairOrder.note || '');
   const [vin, setVin] = useState(item.vehicle?.vin || '');

   const customerName = item.customer
     ? `${item.customer.first_name} ${item.customer.last_name}`.trim()
     : '';

   const vehicleDisplay = formatVehicleDisplay(item.vehicle);
   const vehicleVin = item.vehicle?.vin ? `VIN: ${item.vehicle.vin}` : 'VIN: —';

   const canSave =
     status !== item.repairOrder.status ||
     (serviceType || '') !== (item.repairOrder.service_type || '') ||
     (jobDescription || '') !== (item.repairOrder.job_description || '') ||
     (note || '') !== (item.repairOrder.note || '');

   return (
     <div className="px-4 py-3">
       <div className="grid grid-cols-12 gap-3 text-sm">
         <div className="col-span-2">
           <select
             className="select-dark w-full px-2 py-1"
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
           {update.isPending ? (
             <div className="mt-1 text-xs text-slate-400">Saving…</div>
           ) : update.isError ? (
             <div className="mt-1 text-xs text-red-400">Save failed</div>
           ) : null}
         </div>
         <div className="col-span-4">
           <div className="font-medium text-slate-100">{vehicleDisplay || 'Unknown vehicle'}</div>
           <div className="text-xs text-slate-400">{vehicleVin}</div>
         </div>
         <div className="col-span-3">
           <div className="font-medium text-slate-100">{customerName || 'Unknown customer'}</div>
           <div className="text-xs text-slate-400">{item.customer?.phone || ''}</div>
         </div>
         <div className="col-span-2">
           <div className="text-slate-100">{item.repairOrder.service_type || ''}</div>
         </div>
         <div className="col-span-1 flex justify-end gap-3">
           <button
             className="text-sm font-medium text-slate-100 hover:text-white"
             onClick={() => setExpanded((v) => !v)}
           >
             {expanded ? 'Close' : 'Edit'}
           </button>
         </div>
       </div>

       {expanded ? (
         <div className="mt-4 space-y-4 rounded-md border border-white/10 bg-white/5 p-4 backdrop-blur">
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
             <div>
               <div className="text-xs font-medium text-slate-300">Status</div>
               <select
                 className="select-dark mt-1 w-full"
                 value={status}
                 onChange={(e) => setStatus(e.target.value as RepairOrderStatus)}
               >
                 {RO_STATUS_OPTIONS.map((s) => (
                   <option key={s} value={s}>
                     {s}
                   </option>
                 ))}
               </select>
             </div>
             <div>
               <div className="text-xs font-medium text-slate-300">Service type</div>
               <input
                 className="input-dark mt-1"
                 value={serviceType}
                 onChange={(e) => setServiceType(e.target.value)}
               />
             </div>
           </div>

           <div>
             <div className="text-xs font-medium text-slate-300">Job description</div>
             <textarea
               className="input-dark mt-1"
               rows={3}
               value={jobDescription}
               onChange={(e) => setJobDescription(e.target.value)}
             />
           </div>

           <div>
             <div className="text-xs font-medium text-slate-300">Note</div>
             <textarea
               className="input-dark mt-1"
               rows={2}
               value={note}
               onChange={(e) => setNote(e.target.value)}
             />
           </div>

           <div className="rounded-md border border-white/10 bg-white/3 p-3 space-y-2 backdrop-blur">
             <div className="text-xs font-medium text-slate-300">Check-in / Add VIN</div>
             <div className="flex flex-wrap items-end gap-3">
               <div>
                 <div className="text-xs font-medium text-slate-300">VIN</div>
                 <input
                   className="input-dark mt-1 w-80"
                   value={vin}
                   onChange={(e) => setVin(e.target.value)}
                 />
               </div>
               <button
                 className="btn-gold-sm disabled:opacity-40"
                 disabled={!vin.trim() || checkInVin.isPending}
                 onClick={() => checkInVin.mutate({ repair_order_id: item.repairOrder.id, vin })}
               >
                 {checkInVin.isPending ? 'Saving…' : 'Save VIN'}
               </button>
             </div>
             {checkInVin.isError ? <div className="text-sm text-red-400">Failed to save VIN</div> : null}
             {checkInVin.isSuccess ? (
               <div className="text-sm text-emerald-400">
                 {checkInVin.data.action === 'linked_existing_vehicle'
                   ? 'VIN matched an existing vehicle. Repair order linked.'
                   : 'VIN saved to vehicle.'}
               </div>
             ) : null}
           </div>

           <div className="flex items-center justify-end gap-3">
             {update.isError ? <div className="text-sm text-red-400">Failed to save</div> : null}
             {update.isSuccess ? <div className="text-sm text-emerald-400">Saved</div> : null}
             <button
               className="btn-gold-sm disabled:opacity-40"
               disabled={!canSave || update.isPending}
               onClick={() =>
                 update.mutate({
                   id: item.repairOrder.id,
                   status,
                   service_type: serviceType,
                   job_description: jobDescription,
                   note,
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
        <a className="btn-gold-sm" href="/repair-orders/new">
          New Repair Order
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-300" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="select-dark"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
