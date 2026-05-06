import { useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem("cookieConsent"),
  );

  const accept = () => {
    localStorage.setItem("cookieConsent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
      <p className="text-sm text-gray-300">
        We use cookies for authentication and to improve your experience. By
        using 360EVO, you agree to our{" "}
        <a href="/privacy" className="underline text-indigo-400">
          Privacy Policy
        </a>
        .
      </p>
      <button
        onClick={accept}
        className="shrink-0 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium"
      >
        Accept
      </button>
    </div>
  );
}
