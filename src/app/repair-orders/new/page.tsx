 'use client';

 import { useMemo, useState } from 'react';
 import { useRouter } from 'next/navigation';
 import { useCustomerByPhone } from '@/hooks/use-customer-by-phone';
 import { useCreateCustomer } from '@/hooks/use-create-customer';
 import { useCreateVehicle } from '@/hooks/use-create-vehicle';
 import { useCreateRepairOrder } from '@/hooks/use-create-repair-order';
 import { useVehiclesByCustomer } from '@/hooks/use-vehicles-by-customer';

 export default function NewRepairOrderPage() {
   const router = useRouter();

   const [phone, setPhone] = useState('');
   const [searchedPhone, setSearchedPhone] = useState<string | null>(null);

   const customerQuery = useCustomerByPhone(searchedPhone || '');
   const createCustomer = useCreateCustomer();
   const createVehicle = useCreateVehicle();
   const createRepairOrder = useCreateRepairOrder();

   const [firstName, setFirstName] = useState('');
   const [lastName, setLastName] = useState('');

   const [vehicleMode, setVehicleMode] = useState<'existing' | 'new'>('existing');
   const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

   const [serviceType, setServiceType] = useState('');
   const [jobDescription, setJobDescription] = useState('');
   const [note, setNote] = useState('');

   const [year, setYear] = useState('');
   const [make, setMake] = useState('');
   const [model, setModel] = useState('');
   const [licensePlate, setLicensePlate] = useState('');

   const selectedCustomer = customerQuery.data || null;
   const vehiclesQuery = useVehiclesByCustomer(selectedCustomer?.id || '');
   const vehicles = vehiclesQuery.data || [];

   const canSearch = useMemo(() => phone.trim().length >= 7, [phone]);
   const canCreateCustomer = useMemo(() => {
     return Boolean(searchedPhone) && !customerQuery.isLoading && !selectedCustomer;
   }, [customerQuery.isLoading, searchedPhone, selectedCustomer]);

   const canCreateRepairOrder = useMemo(() => {
     if (!selectedCustomer?.id) return false;
     if (!serviceType.trim()) return false;
     if (vehicleMode === 'existing') return Boolean(selectedVehicleId);
     return Boolean(year.trim()) && Boolean(make.trim()) && Boolean(model.trim());
   }, [make, model, selectedCustomer?.id, selectedVehicleId, serviceType, vehicleMode, year]);

   const onSearch = () => {
     const p = phone.trim();
     if (!p) return;
     setSearchedPhone(p);
   };

   const onQuickCreateCustomer = async () => {
     if (!searchedPhone) return;
     await createCustomer.mutateAsync({
       phone: searchedPhone,
       first_name: firstName || undefined,
       last_name: lastName || undefined,
     });
   };

   const onCreate = async () => {
     if (!selectedCustomer?.id) return;

     const vehicleId =
       vehicleMode === 'existing'
         ? selectedVehicleId
         : (await createVehicle.mutateAsync({
             year: year.trim(),
             make: make.trim(),
             model: model.trim(),
             license_plate: licensePlate.trim() || undefined,
             customer_id: selectedCustomer.id,
           })).id;

     const ro = await createRepairOrder.mutateAsync({
       vehicle_id: vehicleId,
       customer_id: selectedCustomer.id,
       status: 'New',
       service_type: serviceType.trim(),
       job_description: jobDescription.trim() || undefined,
       note: note.trim() || undefined,
     });

     router.push('/repair-orders');
   };

   const busy =
     customerQuery.isFetching ||
     vehiclesQuery.isFetching ||
     createCustomer.isPending ||
     createVehicle.isPending ||
     createRepairOrder.isPending;

   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-2xl font-semibold">Create Repair Order</h1>
         <p className="mt-1 text-sm text-gray-600">Phone-first intake. VIN can be added later.</p>
       </div>

       <div className="rounded-lg border bg-white p-6 space-y-6">
         <div className="space-y-3">
           <div className="text-sm font-medium text-gray-900">1) Customer</div>
           <div className="flex flex-wrap items-end gap-3">
             <div>
               <div className="text-xs font-medium text-gray-600">Phone</div>
               <input
                 className="mt-1 w-64 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
                 placeholder="e.g. 6168219153"
               />
             </div>
             <button
               className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
               disabled={!canSearch || busy}
               onClick={onSearch}
             >
               Search
             </button>
           </div>

           {searchedPhone ? (
             <div className="text-sm text-gray-700">
               Searching for: <span className="font-mono">{searchedPhone}</span>
             </div>
           ) : null}

           {customerQuery.isLoading ? (
             <div className="text-sm text-gray-600">Loading customer…</div>
           ) : selectedCustomer ? (
             <div className="rounded-md border bg-gray-50 p-4">
               <div className="text-sm font-medium text-gray-900">
                 {selectedCustomer.first_name} {selectedCustomer.last_name}
               </div>
               <div className="mt-1 text-xs text-gray-600">{selectedCustomer.phone}</div>
             </div>
           ) : searchedPhone && !customerQuery.isError ? (
             <div className="rounded-md border bg-white p-4 space-y-3">
               <div className="text-sm text-gray-800">No customer found. Quick create:</div>
               <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                 <div>
                   <div className="text-xs font-medium text-gray-600">First name</div>
                   <input
                     className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                     value={firstName}
                     onChange={(e) => setFirstName(e.target.value)}
                   />
                 </div>
                 <div>
                   <div className="text-xs font-medium text-gray-600">Last name</div>
                   <input
                     className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                     value={lastName}
                     onChange={(e) => setLastName(e.target.value)}
                   />
                 </div>
               </div>
               <button
                 className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                 disabled={!canCreateCustomer || busy}
                 onClick={onQuickCreateCustomer}
               >
                 {createCustomer.isPending ? 'Creating…' : 'Create Customer'}
               </button>
             </div>
           ) : customerQuery.isError ? (
             <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
               {(customerQuery.error as any)?.message || 'Failed to search customer'}
             </div>
           ) : null}
         </div>

         <div className="space-y-3">
          <div className="text-sm font-medium text-gray-900">2) Repair order details</div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="md:col-span-1">
              <div className="text-xs font-medium text-gray-600">Service type</div>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="e.g. Tires, Oil Change, Brakes"
                disabled={!selectedCustomer}
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-gray-600">Job description</div>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="What are we doing / what did the customer request?"
                disabled={!selectedCustomer}
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-600">Note</div>
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note (optional)"
              disabled={!selectedCustomer}
            />
          </div>
        </div>

         <div className="space-y-3">
           <div className="text-sm font-medium text-gray-900">3) Vehicle</div>

           <div className="flex flex-wrap items-center gap-3">
             <label className="text-sm font-medium text-gray-700" htmlFor="vehicleMode">
               Use
             </label>
             <select
               id="vehicleMode"
               value={vehicleMode}
               onChange={(e) => setVehicleMode(e.target.value as any)}
               className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
               disabled={!selectedCustomer}
             >
               <option value="existing">Existing vehicle</option>
               <option value="new">Add new vehicle</option>
             </select>
           </div>

           {vehicleMode === 'existing' ? (
             <div className="space-y-2">
               {!selectedCustomer ? (
                 <div className="text-sm text-gray-600">Select a customer first.</div>
               ) : vehiclesQuery.isLoading ? (
                 <div className="text-sm text-gray-600">Loading vehicles…</div>
               ) : vehicles.length === 0 ? (
                 <div className="rounded-md border bg-white p-4">
                   <div className="text-sm text-gray-800">No vehicles found for this customer.</div>
                   <div className="mt-1 text-xs text-gray-500">Switch to “Add new vehicle”.</div>
                 </div>
               ) : (
                 <div className="rounded-md border bg-white p-4 space-y-3">
                   <div className="text-sm text-gray-800">Select vehicle:</div>
                   <select
                     value={selectedVehicleId}
                     onChange={(e) => setSelectedVehicleId(e.target.value)}
                     className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                   >
                     <option value="">Choose…</option>
                     {vehicles.map((v) => {
                       const label = [v.year, v.make, v.model].filter(Boolean).join(' ');
                       const meta = [v.license_plate ? `Plate ${v.license_plate}` : '', v.vin ? `VIN ${v.vin}` : '']
                         .filter(Boolean)
                         .join(' • ');
                       return (
                         <option key={v.id} value={v.id}>
                           {label || 'Vehicle'}{meta ? ` (${meta})` : ''}
                         </option>
                       );
                     })}
                   </select>
                 </div>
               )}
             </div>
           ) : (
             <div className="space-y-3">
               <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                 <div>
                   <div className="text-xs font-medium text-gray-600">Year</div>
                   <input
                     className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                     value={year}
                     onChange={(e) => setYear(e.target.value)}
                     disabled={!selectedCustomer}
                   />
                 </div>
                 <div>
                   <div className="text-xs font-medium text-gray-600">Make</div>
                   <input
                     className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                     value={make}
                     onChange={(e) => setMake(e.target.value)}
                     disabled={!selectedCustomer}
                   />
                 </div>
                 <div>
                   <div className="text-xs font-medium text-gray-600">Model</div>
                   <input
                     className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                     value={model}
                     onChange={(e) => setModel(e.target.value)}
                     disabled={!selectedCustomer}
                   />
                 </div>
                 <div>
                   <div className="text-xs font-medium text-gray-600">Plate (optional)</div>
                   <input
                     className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                     value={licensePlate}
                     onChange={(e) => setLicensePlate(e.target.value)}
                     disabled={!selectedCustomer}
                   />
                 </div>
               </div>
               <div className="text-xs text-gray-500">VIN is captured later during check-in.</div>
             </div>
           )}
         </div>

         <div className="flex items-center justify-between gap-3">
           <a className="text-sm font-medium text-gray-700 hover:underline" href="/repair-orders">
             Cancel
           </a>
           <button
             className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
             disabled={!canCreateRepairOrder || busy}
             onClick={onCreate}
           >
             {busy ? 'Creating…' : 'Create Repair Order'}
           </button>
         </div>
       </div>
     </div>
   );
 }
