import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./styles/tailwind.css";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./providers/SocketProvider.tsx";

import { AuthProvider } from "./providers/AuthProvider";
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ToastProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </ToastProvider>
  </AuthProvider>,
);
