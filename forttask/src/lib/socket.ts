import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [eventsRefresh, setEventsRefresh] = useState(false);
    const [shoppingRefresh, setShoppingRefresh] = useState(false);
    const [billsRefresh, setBillsRefresh] = useState(false);
    const [choresRefresh, setChoresRefresh] = useState(false);

    useEffect(() => {
        const socketIo = io();

        socketIo.on('connect', () => {
            setIsConnected(true);
        });

        socketIo.on('disconnect', () => {
            setIsConnected(false);
        });

        socketIo.on('update-events', () => {
            setEventsRefresh((prev) => !prev);
        });

        socketIo.on('update-shopping', () => {
            setShoppingRefresh((prev) => !prev);
        });

        socketIo.on('update-bills', () => {
            setBillsRefresh((prev) => !prev);
        });

        socketIo.on('update-chores', () => {
            setChoresRefresh((prev) => !prev);
        });

        setSocket(socketIo);

        return () => {
            socketIo.disconnect();
        };
    }, []);

    const emitUpdate = (householdId: number, page: string) => {
        if (socket && householdId) {
            switch (page) {
                case 'events':
                    socket.emit('update-events', householdId);
                    break;
                case 'shopping':
                    socket.emit('update-shopping', householdId);
                    break;
                case 'bills':
                    socket.emit('update-bills', householdId);
                    break;
                case 'chores':
                    socket.emit('update-chores', householdId);
                    break;
                default:
                    console.error('Invalid page');
            }
        } else {
            console.error('Socket is not initialized or missing householdId');
        }
    };

    const joinHousehold = (householdId: string) => {
        if (socket) {
            socket.emit('join-household', householdId);
        } else {
            console.error('Socket is not initialized');
        }
    };

    const leaveHousehold = (householdId: string) => {
        if (socket) {
            socket.emit('leave-household', householdId);
        } else {
            console.error('Socket is not initialized');
        }
    };

    return {
        isConnected,
        eventsRefresh,
        shoppingRefresh,
        billsRefresh,
        choresRefresh,
        emitUpdate,
        joinHousehold,
        leaveHousehold,
    };
};
