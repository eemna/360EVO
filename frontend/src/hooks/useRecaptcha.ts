import { useCallback, useEffect, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        options: { action: string },
      ) => Promise<string>;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

let scriptPromise: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
  if (!SITE_KEY) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="recaptcha/api.js"]',
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Google reCAPTCHA v3 (invisible). When VITE_RECAPTCHA_SITE_KEY is unset,
 * getToken resolves to null and the backend skips enforcement — so dev
 * environments keep working without keys.
 */
export const useRecaptcha = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadScript()
      .then(() => setReady(true))
      .catch(() => setReady(false));
  }, []);

  const getToken = useCallback(
    async (action: string): Promise<string | null> => {
      if (!SITE_KEY || !window.grecaptcha) return null;
      return new Promise((resolve) => {
        window.grecaptcha!.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(SITE_KEY, {
              action,
            });
            resolve(token);
          } catch {
            resolve(null);
          }
        });
      });
    },
    [],
  );

  return { getToken, enabled: Boolean(SITE_KEY), ready };
};
