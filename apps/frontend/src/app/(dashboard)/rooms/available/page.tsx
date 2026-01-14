'use client';

import { useState } from 'react';
import { useFloors, useAvailableBeds } from '@/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Skeleton,
} from '@/components/ui';
import { Bed } from 'lucide-react';
import type { RoomType, AvailableBedFilters, AvailableBed } from '@/types';

const roomTypeOptions = [
  { value: '', label: 'All Room Types' },
  { value: 'GENERAL', label: 'General' },
  { value: 'ICU', label: 'ICU' },
  { value: 'VIP', label: 'VIP' },
  { value: 'ISOLATION', label: 'Isolation' },
  { value: 'EMERGENCY', label: 'Emergency' },
];

const roomTypeLabels: Record<RoomType, string> = {
  GENERAL: 'General',
  ICU: 'ICU',
  VIP: 'VIP',
  ISOLATION: 'Isolation',
  EMERGENCY: 'Emergency',
};

interface AvailableBedsPageProps {
  onSelect?: (bed: AvailableBed) => void;
}

export default function AvailableBedsPage({ onSelect }: AvailableBedsPageProps) {
  const [filters, setFilters] = useState<AvailableBedFilters>({});

  const { data: floors } = useFloors();
  const { data: beds, isLoading, error } = useAvailableBeds(filters);

  const floorOptions = [
    { value: '', label: 'All Floors' },
    ...(floors?.map((floor) => ({
      value: floor.id,
      label: floor.name,
    })) || []),
  ];

  const handleFloorChange = (floorId: string) => {
    setFilters({ ...filters, floorId: floorId || undefined });
  };

  const handleRoomTypeChange = (roomType: string) => {
    setFilters({ ...filters, roomType: (roomType as RoomType) || undefined });
  };

  const handleSelectBed = (bed: AvailableBed) => {
    if (onSelect) {
      onSelect(bed);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bed className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Available Beds</h1>
        </div>
        {beds && (
          <Badge variant="success">
            {beds.length} bed{beds.length !== 1 ? 's' : ''} available
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Select
                options={floorOptions}
                value={filters.floorId || ''}
                onChange={(e) => handleFloorChange(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={roomTypeOptions}
                value={filters.roomType || ''}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-destructive">
              Failed to load available beds. Please try again.
            </div>
          ) : beds?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No available beds found for the selected filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Floor</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Room Type</TableHead>
                  {onSelect && <TableHead className="w-24">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {beds?.map((bed) => (
                  <TableRow key={bed.id}>
                    <TableCell>{bed.room.floor.name}</TableCell>
                    <TableCell className="font-medium">{bed.room.roomNumber}</TableCell>
                    <TableCell>{bed.bedNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roomTypeLabels[bed.room.roomType]}
                      </Badge>
                    </TableCell>
                    {onSelect && (
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSelectBed(bed)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
