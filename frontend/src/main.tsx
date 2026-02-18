//import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./styles/tailwind.css";
import { ToastProvider } from "./context/ToastContext";

import { AuthProvider } from "./providers/AuthProvider";
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>,
);
