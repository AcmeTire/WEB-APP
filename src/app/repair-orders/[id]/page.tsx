 'use client';

 import { useEffect, useMemo, useState } from 'react';
 import type { RepairOrderStatus } from '@/types';
 import { useRepairOrder } from '@/hooks/use-repair-order';
 import { useUpdateRepairOrder } from '@/hooks/use-update-repair-order';

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

 export default function RepairOrderDetailPage({ params }: { params: { id: string } }) {
   const id = params.id;
   const { data, isLoading, isError, error } = useRepairOrder(id);
   const update = useUpdateRepairOrder();

   const [status, setStatus] = useState<RepairOrderStatus>('New');
   const [notes, setNotes] = useState<string>('');

   useEffect(() => {
     if (data) {
       setStatus(data.status);
       setNotes(data.notes || '');
     }
   }, [data]);

   const canSave = useMemo(() => {
     if (!data) return false;
     return status !== data.status || (notes || '') !== (data.notes || '');
   }, [data, notes, status]);

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
               <div className="text-xs font-medium text-gray-600">Service</div>
               <div className="mt-2 text-sm text-gray-900">{data.service_type || ''}</div>
               <div className="mt-1 text-xs text-gray-500">Vehicle ID: {data.vehicle_id}</div>
             </div>
           </div>

           <div>
             <div className="text-xs font-medium text-gray-600">Notes</div>
             <textarea
               className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
               rows={6}
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
             />
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
                 onClick={() => update.mutate({ id, status, notes })}
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
