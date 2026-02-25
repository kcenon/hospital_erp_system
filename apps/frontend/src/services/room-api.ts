import { apiGet } from '@/lib/api-client';
import type { Floor, FloorDashboard, AvailableBed, AvailableBedFilters } from '@/types';

const ROOM_ENDPOINTS = {
  BUILDINGS: '/rooms/buildings',
  FLOOR_DASHBOARD: '/rooms/dashboard/floor',
  AVAILABLE_BEDS: '/rooms/beds/available',
} as const;

interface BuildingResponse {
  id: string;
  name: string;
  floors?: Array<{
    id: string;
    name: string;
    floorNumber: number;
  }>;
}

function buildAvailableBedsQuery(filters: AvailableBedFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.floorId) searchParams.set('floorId', filters.floorId);
  if (filters.roomType) searchParams.set('roomType', filters.roomType);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const roomApi = {
  getFloors: async (): Promise<Floor[]> => {
    const buildings = await apiGet<BuildingResponse[]>(ROOM_ENDPOINTS.BUILDINGS);
    return buildings.flatMap((building) =>
      (building.floors || []).map((floor) => ({
        id: floor.id,
        name: floor.name,
        floorNumber: floor.floorNumber,
        building: building.name,
      })),
    );
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
