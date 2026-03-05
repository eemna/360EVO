import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("accessToken");

    const baseURL = import.meta.env.VITE_API_URL.replace("/api", "");

const newSocket = io(baseURL, {
  path: "/api/socket.io",
  auth: { token },
  withCredentials: true,
});

    socketRef.current = newSocket;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    // 🔥 LISTEN FOR ONLINE USERS
    newSocket.on("online_users", (users: string[]) => {
      setOnlineUsers(new Set(users));
    });

    newSocket.on("user_online", (userId: string) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    });

    newSocket.on("user_offline", (userId: string) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};