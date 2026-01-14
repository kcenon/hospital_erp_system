'use client';

import { Card, CardContent, Badge } from '@/components/ui';
import { BedCell } from './bed-cell';
import type { RoomStatus, RoomType } from '@/types';

interface RoomCardProps {
  room: RoomStatus;
}

const roomTypeLabels: Record<RoomType, string> = {
  GENERAL: 'General',
  ICU: 'ICU',
  VIP: 'VIP',
  ISOLATION: 'Isolation',
  EMERGENCY: 'Emergency',
};

const roomTypeVariants: Record<
  RoomType,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  GENERAL: 'outline',
  ICU: 'destructive',
  VIP: 'default',
  ISOLATION: 'warning',
  EMERGENCY: 'destructive',
};

export function RoomCard({ room }: RoomCardProps) {
  const occupiedCount = room.beds.filter((bed) => bed.status === 'OCCUPIED').length;
  const totalBeds = room.beds.length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{room.roomNumber}</h3>
            <span className="text-sm text-muted-foreground">
              ({occupiedCount}/{totalBeds})
            </span>
          </div>
          <Badge variant={roomTypeVariants[room.roomType]}>{roomTypeLabels[room.roomType]}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {room.beds.map((bed) => (
            <BedCell key={bed.id} bed={bed} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
