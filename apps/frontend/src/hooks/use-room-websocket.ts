'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import type { BedStatusUpdate, FloorDashboard } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

function updateBedInDashboard(
  dashboard: FloorDashboard,
  update: BedStatusUpdate
): FloorDashboard {
  return {
    ...dashboard,
    rooms: dashboard.rooms.map((room) => {
      if (room.id !== update.roomId) return room;
      return {
        ...room,
        beds: room.beds.map((bed) => {
          if (bed.id !== update.bedId) return bed;
          return {
            ...bed,
            status: update.status,
            patient: update.patient,
            admissionId: update.admissionId,
          };
        }),
      };
    }),
  };
}

interface UseRoomWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
}

export function useRoomWebSocket(floorId: string): UseRoomWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  useEffect(() => {
    if (!floorId || !accessToken) return;

    const newSocket = io(`${WS_URL}/rooms`, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('subscribe:floor', floorId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    newSocket.on('room:status', (data: FloorDashboard) => {
      queryClient.setQueryData(['floor-dashboard', floorId], data);
    });

    newSocket.on('bed:status', (data: BedStatusUpdate) => {
      queryClient.setQueryData(
        ['floor-dashboard', floorId],
        (old: FloorDashboard | undefined) => {
          if (!old) return old;
          return updateBedInDashboard(old, data);
        }
      );
    });

    newSocket.on('admission:created', () => {
      queryClient.invalidateQueries({ queryKey: ['floor-dashboard', floorId] });
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
    });

    newSocket.on('admission:discharged', () => {
      queryClient.invalidateQueries({ queryKey: ['floor-dashboard', floorId] });
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('unsubscribe:floor', floorId);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [floorId, accessToken, queryClient]);

  return { socket, isConnected, reconnect };
}
