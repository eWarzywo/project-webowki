import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [socketRefresh, setSocketRefresh] = useState(false);

    useEffect(() => {
        const socketIo = io();

        socketIo.on('connect', () => {
            setIsConnected(true);
        });

        socketIo.on('disconnect', () => {
            setIsConnected(false);
        });

        socketIo.on('refresh', () => {
            setSocketRefresh((prev) => !prev);
        });

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, []);

    const emitUpdate = (householdId?: number) => {
        if (socket && householdId) {
            socket.emit('refresh', { householdId });
        } else {
            console.error('Socket is not initialized or missing householdId');
        }
    };

    const joinHousehold = (householdId: string) => {
        if (socket) {
            socket.emit('join household', householdId);
        } else {
            console.error('Socket is not initialized');
        }
    }

    return { isConnected, socketRefresh, emitUpdate, joinHousehold };
}