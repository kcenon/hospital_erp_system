import { useQuery } from '@tanstack/react-query';
import { roomApi } from '@/services';
import type { AvailableBedFilters } from '@/types';

export function useFloors() {
  return useQuery({
    queryKey: ['floors'],
    queryFn: () => roomApi.getFloors(),
  });
}

export function useFloorDashboard(floorId: string) {
  return useQuery({
    queryKey: ['floor-dashboard', floorId],
    queryFn: () => roomApi.getFloorDashboard(floorId),
    enabled: !!floorId,
  });
}

export function useAvailableBeds(filters: AvailableBedFilters = {}) {
  return useQuery({
    queryKey: ['available-beds', filters],
    queryFn: () => roomApi.getAvailableBeds(filters),
  });
}
