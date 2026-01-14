import { apiGet } from '@/lib/api-client';
import type { Floor, FloorDashboard, AvailableBed, AvailableBedFilters } from '@/types';

const ROOM_ENDPOINTS = {
  FLOORS: '/api/v1/floors',
  FLOOR_DASHBOARD: '/api/v1/rooms/floor-dashboard',
  AVAILABLE_BEDS: '/api/v1/beds/available',
} as const;

function buildAvailableBedsQuery(filters: AvailableBedFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.floorId) searchParams.set('floorId', filters.floorId);
  if (filters.roomType) searchParams.set('roomType', filters.roomType);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const roomApi = {
  getFloors: (): Promise<Floor[]> => {
    return apiGet<Floor[]>(ROOM_ENDPOINTS.FLOORS);
  },

  getFloorDashboard: (floorId: string): Promise<FloorDashboard> => {
    return apiGet<FloorDashboard>(`${ROOM_ENDPOINTS.FLOOR_DASHBOARD}/${floorId}`);
  },

  getAvailableBeds: (filters: AvailableBedFilters = {}): Promise<AvailableBed[]> => {
    return apiGet<AvailableBed[]>(
      `${ROOM_ENDPOINTS.AVAILABLE_BEDS}${buildAvailableBedsQuery(filters)}`,
    );
  },
};
