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
             className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
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
             <div className="mt-1 text-xs text-gray-500">Saving…</div>
           ) : update.isError ? (
             <div className="mt-1 text-xs text-red-700">Save failed</div>
           ) : null}
         </div>
         <div className="col-span-4">
           <div className="font-medium text-gray-900">{vehicleDisplay || 'Unknown vehicle'}</div>
           <div className="text-xs text-gray-500">{vehicleVin}</div>
         </div>
         <div className="col-span-3">
           <div className="font-medium text-gray-900">{customerName || 'Unknown customer'}</div>
           <div className="text-xs text-gray-500">{item.customer?.phone || ''}</div>
         </div>
         <div className="col-span-2">
           <div className="text-gray-900">{item.repairOrder.service_type || ''}</div>
         </div>
         <div className="col-span-1 flex justify-end gap-3">
           <button
             className="text-sm font-medium text-gray-900 hover:underline"
             onClick={() => setExpanded((v) => !v)}
           >
             {expanded ? 'Close' : 'Edit'}
           </button>
         </div>
       </div>

       {expanded ? (
         <div className="mt-4 rounded-md border bg-gray-50 p-4 space-y-4">
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
             <div>
               <div className="text-xs font-medium text-gray-600">Status</div>
               <select
                 className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
               <div className="text-xs font-medium text-gray-600">Service type</div>
               <input
                 className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                 value={serviceType}
                 onChange={(e) => setServiceType(e.target.value)}
               />
             </div>
           </div>

           <div>
             <div className="text-xs font-medium text-gray-600">Job description</div>
             <textarea
               className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
               rows={3}
               value={jobDescription}
               onChange={(e) => setJobDescription(e.target.value)}
             />
           </div>

           <div>
             <div className="text-xs font-medium text-gray-600">Note</div>
             <textarea
               className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
               rows={2}
               value={note}
               onChange={(e) => setNote(e.target.value)}
             />
           </div>

           <div className="rounded-md border bg-white p-3 space-y-2">
             <div className="text-xs font-medium text-gray-600">Check-in / Add VIN</div>
             <div className="flex flex-wrap items-end gap-3">
               <div>
                 <div className="text-xs font-medium text-gray-600">VIN</div>
                 <input
                   className="mt-1 w-80 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                   value={vin}
                   onChange={(e) => setVin(e.target.value)}
                 />
               </div>
               <button
                 className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                 disabled={!vin.trim() || checkInVin.isPending}
                 onClick={() => checkInVin.mutate({ repair_order_id: item.repairOrder.id, vin })}
               >
                 {checkInVin.isPending ? 'Saving…' : 'Save VIN'}
               </button>
             </div>
             {checkInVin.isError ? <div className="text-sm text-red-700">Failed to save VIN</div> : null}
             {checkInVin.isSuccess ? (
               <div className="text-sm text-emerald-700">
                 {checkInVin.data.action === 'linked_existing_vehicle'
                   ? 'VIN matched an existing vehicle. Repair order linked.'
                   : 'VIN saved to vehicle.'}
               </div>
             ) : null}
           </div>

           <div className="flex items-center justify-end gap-3">
             {update.isError ? <div className="text-sm text-red-700">Failed to save</div> : null}
             {update.isSuccess ? <div className="text-sm text-emerald-700">Saved</div> : null}
             <button
               className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
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
           <p className="mt-1 text-sm text-gray-600">Browse and manage repair orders</p>
         </div>
         <a className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white" href="/repair-orders/new">
           New Repair Order
         </a>
       </div>

       <div className="flex flex-wrap items-center gap-3">
         <label className="text-sm font-medium text-gray-700" htmlFor="status">
           Status
         </label>
         <select
           id="status"
           value={status}
           onChange={(e) => setStatus(e.target.value as any)}
           className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
         >
           {STATUS_OPTIONS.map((s) => (
             <option key={s} value={s}>
               {s}
             </option>
           ))}
         </select>
       </div>

       {isLoading ? (
         <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">Loading…</div>
       ) : isError ? (
         <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
           {(error as any)?.message || 'Failed to load repair orders'}
         </div>
       ) : rows.length === 0 ? (
         <div className="rounded-lg border bg-white p-6">
           <div className="text-sm text-gray-700">No repair orders found.</div>
         </div>
       ) : (
         <div className="overflow-hidden rounded-lg border bg-white">
           <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-medium text-gray-600">
             <div className="col-span-2">Status</div>
             <div className="col-span-4">Vehicle</div>
             <div className="col-span-3">Customer</div>
             <div className="col-span-2">Service</div>
             <div className="col-span-1 text-right">Edit</div>
           </div>
           <div className="divide-y">
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
