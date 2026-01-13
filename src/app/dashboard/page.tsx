 'use client';

 import type { ActiveRepairOrderItem, RepairOrderStatus } from '@/types';
 import { useActiveRepairOrders } from '@/hooks/use-active-repair-orders';

 const formatVehicleDisplay = (vehicle: ActiveRepairOrderItem['vehicle']) => {
   if (!vehicle) return '';
   return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
 };

 const statusBadgeClasses = (status: RepairOrderStatus) => {
   switch (status) {
     case 'New':
       return 'bg-blue-50 text-blue-700 ring-blue-200';
     case 'Scheduled':
     case 'Dropped Off':
       return 'bg-purple-50 text-purple-700 ring-purple-200';
     case 'Diagnosing':
     case 'Waiting Approval':
       return 'bg-amber-50 text-amber-800 ring-amber-200';
     case 'In Progress':
       return 'bg-amber-50 text-amber-800 ring-amber-200';
     case 'Ready For Pickup':
       return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
     case 'Completed':
       return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
     default:
       return 'bg-gray-50 text-gray-700 ring-gray-200';
   }
 };

 export default function DashboardPage() {
   const { data, isLoading, isError, error } = useActiveRepairOrders();

   return (
     <div className="space-y-6">
       <div className="flex items-start justify-between gap-4">
         <div>
           <h1 className="text-2xl font-semibold">Dashboard</h1>
           <p className="mt-1 text-sm text-gray-600">Active repair orders</p>
         </div>
         <a
           className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
           href="/repair-orders/new"
         >
           New Repair Order
         </a>
       </div>

       {isLoading ? (
         <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">Loading…</div>
       ) : isError ? (
         <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
           {(error as any)?.message || 'Failed to load active repair orders'}
         </div>
       ) : (data || []).length === 0 ? (
         <div className="rounded-lg border bg-white p-6">
           <div className="text-sm text-gray-700">No active repair orders found.</div>
           <div className="mt-2 text-xs text-gray-500">
             Active includes statuses like New, Scheduled, Dropped Off, Diagnosing, Waiting Approval,
             In Progress.
           </div>
         </div>
       ) : (
         <div className="overflow-hidden rounded-lg border bg-white">
           <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 px-4 py-3 text-xs font-medium text-gray-600">
             <div className="col-span-2">Status</div>
             <div className="col-span-4">Vehicle</div>
             <div className="col-span-3">Customer</div>
             <div className="col-span-2">Service</div>
             <div className="col-span-1 text-right">View</div>
           </div>
           <div className="divide-y">
             {(data || []).map((item) => {
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
                     <span
                       className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadgeClasses(
                         item.repairOrder.status
                       )}`}
                     >
                       {item.repairOrder.status}
                     </span>
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
