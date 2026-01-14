'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RepairOrder, RepairOrderStatus } from '@/types';

type RepairOrderResponse = {
  data: RepairOrder;
};

type UpdateRepairOrderInput = {
  id: string;
  status?: RepairOrderStatus;
  service_type?: string;
  job_description?: string;
  note?: string;
  notes?: string;
};

export const useUpdateRepairOrder = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRepairOrderInput) => {
      const { id, ...body } = input;
      const res = await apiClient.patch<RepairOrderResponse>(`/api/crm/repair-orders/${id}`, body);
      return res.data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['repair-orders'] });
      qc.setQueryData(['repair-orders', updated.id], updated);
    },
  });
};
