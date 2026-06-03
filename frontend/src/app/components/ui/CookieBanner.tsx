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

<div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A2A3A] border-t border-white/10 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
  <p className="text-sm text-white/70">
    We use cookies for authentication and to improve your experience. By
    using 360EVO, you agree to our{" "}
    <a href="/privacy" className="underline text-[#1D9E75] hover:text-[#1D9E75]/80">
      Privacy Policy
    </a>.
  </p>
  <button
    onClick={accept}
    className="shrink-0 px-5 py-2 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] rounded-lg text-sm font-medium transition-colors"
  >
    Accept
  </button>
</div>
}
