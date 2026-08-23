import { useEffect, useRef, useState } from "react";
import api from "../../services/axios";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router";
import { useRecaptcha } from "../../hooks/useRecaptcha";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let gisPromise: Promise<void> | null = null;
const loadGis = (): Promise<void> => {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]',
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in failed to load"));
    document.head.appendChild(script);
  });
  return gisPromise;
};

interface Props {
  /** Role selected on the register page; used only when creating a new account */
  role?: string | null;
}

export const GoogleSignInButton = ({ role }: Props) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { getToken } = useRecaptcha();
  const [available, setAvailable] = useState(Boolean(CLIENT_ID));

  useEffect(() => {
    if (!CLIENT_ID) return;

    loadGis()
      .then(() => {
        if (!window.google || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            try {
              const recaptchaToken = await getToken("google_auth");
              const res = await api.post("/auth/google", {
                credential: response.credential,
                role: role || undefined,
                recaptchaToken,
              });
              login(res.data.user, res.data.accessToken);
              showToast({
                type: "success",
                title: "Signed in with Google 🎉",
                message: `Welcome, ${res.data.user.name}!`,
              });
              navigate("/app");
            } catch (err: unknown) {
              const axiosErr = err as {
                response?: { data?: { message?: string } };
              };
              showToast({
                type: "error",
                title: "Google sign-in failed",
                message:
                  axiosErr?.response?.data?.message || "Please try again.",
              });
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_black",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "rectangular",
        });
      })
      .catch(() => setAvailable(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  if (!available) return null;

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center" />
    </div>
  );
};
