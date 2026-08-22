import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function VerifyTwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const preAuthToken = (location.state as { preAuthToken?: string })
    ?.preAuthToken;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  useEffect(() => {
    if (!preAuthToken) {
      navigate("/login");
    }
  }, [preAuthToken, navigate]);

  if (!preAuthToken) {
    return null;
  }

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post("/auth/verify-2fa", {
        preAuthToken,
        code,
      });

      login(data.user, data.accessToken);

      showToast({
        type: "success",
        title: "Login successful 🎉",
        message: "Welcome back!",
      });
      navigate("/app");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      showToast({
        type: "error",
        title: "Verification Failed",
        message: axiosErr?.response?.data?.message || "Invalid or expired code",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-[#e8eef5] px-4 py-8">
      <div className="bg-[#1A2A3A] border border-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-14 w-30 rounded-lg bg-white flex items-center justify-center p-1.5">
              <img
                src="/logo.png"
                alt="360EVO"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>

        <h1 className="text-center text-white text-xl font-semibold mb-2">
          Two-Factor Verification
        </h1>
        <p className="text-center text-white/60 text-sm mb-6">
          Enter the 6-digit code sent to your email
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={secondsLeft <= 0}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg
                       text-white text-center text-2xl tracking-[0.5em]
                       placeholder-white/40
                       focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]/50
                       disabled:opacity-40"
            required
          />

          <p
            className={`text-center text-sm ${
              secondsLeft <= 0 ? "text-red-400" : "text-white/50"
            }`}
          >
            {secondsLeft > 0
              ? `Code expires in ${formatTime(secondsLeft)}`
              : "Code expired. Please login again to get a new one."}
          </p>

          <button
            type="submit"
            disabled={loading || code.length !== 6 || secondsLeft <= 0}
            className="w-full py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/login")}
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
