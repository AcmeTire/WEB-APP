 'use client';

 import { useMemo, useState } from 'react';
 import type { ActiveRepairOrderItem, RepairOrderStatus } from '@/types';
 import { useRepairOrdersEnriched } from '@/hooks/use-repair-orders-enriched';

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
             <div className="col-span-1 text-right">Open</div>
           </div>
           <div className="divide-y">
             {rows.map((item) => {
               const vehicleDisplay = formatVehicleDisplay(item.vehicle);
               const customerName = item.customer
                 ? `${item.customer.first_name} ${item.customer.last_name}`.trim()
                 : '';

               return (
                 <div
                   key={item.repairOrder.id}
                   className="grid grid-cols-12 gap-3 px-4 py-3 text-sm"
                 >
                   <div className="col-span-2">
                     <div className="font-medium text-gray-900">{item.repairOrder.status}</div>
                   </div>
                   <div className="col-span-4">
                     <div className="font-medium text-gray-900">
                       {vehicleDisplay || 'Unknown vehicle'}
                     </div>
                     <div className="text-xs text-gray-500">Vehicle ID: {item.repairOrder.vehicle_id}</div>
                   </div>
                   <div className="col-span-3">
                     <div className="font-medium text-gray-900">
                       {customerName || 'Unknown customer'}
                     </div>
                     <div className="text-xs text-gray-500">{item.customer?.phone || ''}</div>
                   </div>
                   <div className="col-span-2">
                     <div className="text-gray-900">{item.repairOrder.service_type || ''}</div>
                   </div>
                   <div className="col-span-1 text-right">
                     <a
                       className="text-sm font-medium text-blue-700 hover:underline"
                       href={`/repair-orders/${item.repairOrder.id}`}
                     >
                       Open
                     </a>
                   </div>
                 </div>
               );
             })}
           </div>
         </div>
       )}
     </div>
   );
 }
