import { useState } from "react";
import { useNavigate } from "react-router";
import api from "../../services/axios";
import { useToast } from "../../context/ToastContext";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      login(response.data.user, response.data.accessToken);

      showToast({
        type: "success",
        title: "Login successful 🎉",
        message: "Welcome back!",
      });
      navigate("/app");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const status = axiosErr?.response?.status;
      const message = axiosErr?.response?.data?.message;

      if (status === 403 && message === "Please verify your email first") {
        showToast({
          type: "warning",
          title: "Email Not Verified",
          message:
            "Please verify your email first. Check your inbox or spam folder.",
        });
        navigate("/verify-email", { state: { pendingEmail: email } });
        return;
      }

      if (status === 401) {
        showToast({
          type: "error",
          title: "Invalid Credentials",
          message: "Incorrect email or password. Please try again.",
        });
        return;
      }

      showToast({
        type: "error",
        title: status ? "Login Failed" : "Unexpected Error",
        message: message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center bg-[#e8eef5] px-4 py-8">
      <div className="bg-[#1A2A3A] border border-white/10 rounded-xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C9A84C]">
            <span className="font-bold text-[#0D1B2A] text-lg">360</span>
          </div>
        </div>

        <h1 className="text-center text-white text-xl font-semibold mb-2">
          Welcome back to 360EVO
        </h1>
        <p className="text-center text-white/60 text-sm mb-6">
          Sign in to continue your journey
        </p>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field - Fixed white text */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-white/80 text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg 
                         text-white placeholder-white/40 
                         focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]/50
                         transition-colors"
              required
            />
          </div>

          {/* Password Field - Fixed white text */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-white/80 text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg 
                         text-white placeholder-white/40 
                         focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]/50
                         transition-colors"
              required
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-[#1D9E75] hover:text-[#1D9E75]/80 text-sm hover:underline transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#C9A84C] hover:bg-[#D4B55C] text-[#0D1B2A] font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-white/60 text-sm">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-[#1D9E75] hover:underline transition-colors"
          >
            Sign up
          </button>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/")}
            className="text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
