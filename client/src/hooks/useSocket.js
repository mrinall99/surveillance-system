import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frameData, setFrameData] = useState(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('⚡ React Socket.IO Connected to Server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('🔴 React Socket.IO Disconnected');
      setIsConnected(false);
    });

    socketInstance.on('frame_stream', (data) => {
      setFrameData(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected, frameData };
};
