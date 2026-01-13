
import { Customer, RepairOrder, RepairOrderStatus, Vehicle, ZohoApiResponse } from '@/types';

type ZohoCustomer = {
  id: string;
  First_Name?: string;
  Last_Name?: string;
  Phone?: string;
  Email?: string;
};

type ZohoVehicle = {
  id: string;
  Year?: string;
  Make?: string;
  Model?: string;
  VIN?: string;
  Customer?: { id: string } | null;
};

type ZohoDeal = {
  id: string;
  Name?: string;
  Status?: string;
  Job_Description?: string;
  Note?: string;
  Vehicle?: { id: string } | null;
  Customer?: { id: string } | null;
  Created_Time?: string;
  Modified_Time?: string;
};

const normalizeRepairOrderStatus = (status: string | undefined): RepairOrderStatus => {
  const s = (status || '').trim().toLowerCase();

  if (s === 'new') return 'New';
  if (s === 'in progress' || s === 'diagnosing') return 'In Progress';
  if (s === 'completed' || s === 'ready for pickup') return 'Completed';

  if (
    s === 'scheduled' ||
    s === 'dropped off' ||
    s === 'waiting approval' ||
    s.includes('waiting')
  ) {
    return 'Waiting';
  }

  return 'New';
};

export const normalizeCustomer = (z: ZohoCustomer): Customer => ({
  id: z.id,
  first_name: z.First_Name || '',
  last_name: z.Last_Name || '',
  phone: z.Phone || '',
  email: z.Email || undefined,
});

export const normalizeVehicle = (z: ZohoVehicle): Vehicle => ({
  id: z.id,
  year: z.Year || '',
  make: z.Make || '',
  model: z.Model || '',
  vin: z.VIN || '',
  customer_id: z.Customer?.id || '',
});

export const normalizeRepairOrder = (z: ZohoDeal): RepairOrder => ({
  id: z.id,
  vehicle_id: z.Vehicle?.id || '',
  status: normalizeRepairOrderStatus(z.Status),
  service_type: z.Name || '',
  notes: z.Note || z.Job_Description || undefined,
  created_time: z.Created_Time || '',
  updated_time: z.Modified_Time || '',
});

export type ZohoListResponse<T> = ZohoApiResponse<T>;
