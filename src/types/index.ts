export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
};

export type Vehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  customer_id: string;
};

export type RepairOrderStatus =
  | 'New'
  | 'Scheduled'
  | 'Dropped Off'
  | 'Diagnosing'
  | 'Waiting Approval'
  | 'In Progress'
  | 'Ready For Pickup'
  | 'Completed';

export type RepairOrder = {
  id: string;
  vehicle_id: string;
  status: RepairOrderStatus;
  service_type: string;
  notes?: string;
  created_time: string;
  updated_time: string;
};

export type ActiveRepairOrderItem = {
  repairOrder: RepairOrder;
  vehicle: Vehicle | null;
  customer: Customer | null;
};

export type ZohoApiResponse<T> = {
  data: T[];
  info: {
    count: number;
    more_records: boolean;
  };
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  status: number;
};
