'use client';

import { useState } from 'react';
import { useFloors, useFloorDashboard, useRoomWebSocket } from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  LegacySelect,
  Badge,
  Skeleton,
} from '@/components/ui';
import { SummaryCard, RoomCard } from '@/components/room';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const roomTypeOptions = [
  { value: '', label: 'All Room Types' },
  { value: 'GENERAL', label: 'General' },
  { value: 'ICU', label: 'ICU' },
  { value: 'VIP', label: 'VIP' },
  { value: 'ISOLATION', label: 'Isolation' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

export default function RoomDashboardPage() {
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('');

  const { data: floors, isLoading: floorsLoading } = useFloors();
  const { data: dashboard, isLoading: dashboardLoading } = useFloorDashboard(selectedFloorId);
  const { isConnected, reconnect } = useRoomWebSocket(selectedFloorId);

  const floorOptions = [
    { value: '', label: 'Select Floor' },
    ...(floors?.map((floor) => ({
      value: floor.id,
      label: floor.name,
    })) || []),
  ];

  const filteredRooms = dashboard?.rooms.filter((room) => {
    if (!roomTypeFilter) return true;
    return room.roomType === roomTypeFilter;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Room Dashboard</h1>
        <div className="flex items-center gap-4">
          {selectedFloorId && (
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Live
                </Badge>
              ) : (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={reconnect}
                >
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                  <RefreshCw className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Floor Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64">
              {floorsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <LegacySelect
                  options={floorOptions}
                  value={selectedFloorId}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  placeholder="Select floor"
                />
              )}
            </div>
            <div className="w-full md:w-48">
              <LegacySelect
                options={roomTypeOptions}
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedFloorId && dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <SummaryCard title="Total Beds" value={dashboard.summary.totalBeds} />
          <SummaryCard title="Occupied" value={dashboard.summary.occupiedBeds} variant="occupied" />
          <SummaryCard title="Empty" value={dashboard.summary.emptyBeds} variant="empty" />
          <SummaryCard title="Reserved" value={dashboard.summary.reservedBeds} variant="reserved" />
          <SummaryCard
            title="Maintenance"
            value={dashboard.summary.maintenanceBeds}
            variant="maintenance"
          />
        </div>
      )}

      {!selectedFloorId && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Please select a floor to view the room dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedFloorId && dashboardLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {selectedFloorId && !dashboardLoading && filteredRooms && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No rooms found for the selected filter.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredRooms.map((room) => <RoomCard key={room.id} room={room} />)
          )}
        </div>
      )}
    </div>
  );
}
