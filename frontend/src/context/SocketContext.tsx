import { createContext } from "react";
import { Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: new Set(),
});
