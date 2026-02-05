'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ActiveRepairOrderItem } from '@/types';

type ActiveRepairOrdersResponse = {
  data: ActiveRepairOrderItem[];
};

export const useActiveRepairOrders = () => {
  return useQuery({
    queryKey: ['dashboard', 'active-repair-orders'],
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      const res = await apiClient.get<ActiveRepairOrdersResponse>(
        '/api/crm/dashboard/active-repair-orders'
      );
      return res.data;
    },
  });
};
