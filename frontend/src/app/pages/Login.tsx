import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import api from "../../services/axios";
//import { AxiosError } from "axios";
import { InputField } from "../components/ui/inputField";
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
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      login(response.data.user, response.data.accessToken);

      showToast({
        type: "success",
        title: "Login successful 🎉",
        message: "Welcome back!",
      });
      navigate("/app");

    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axiosErr?.response?.status;
      const message = axiosErr?.response?.data?.message;

      if (status === 403 && message === "Please verify your email first") {
        showToast({
          type: "warning",
          title: "Email Not Verified",
          message: "Please verify your email first. Check your inbox or spam folder.",
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

      if (status) {
        showToast({
          type: "error",
          title: "Login Failed",
          message: message || "Something went wrong",
        });
        return;
      }

      showToast({
        type: "error",
        title: "Unexpected Error",
        message: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8eef5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <span className="font-bold text-white">360</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center mb-2">Welcome back to 360EVO</h1>
        <p className="text-center text-muted-foreground mb-6">
          Sign in to continue your journey
        </p>
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <InputField
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              error={error}
              required
            />
          </div>

          <div className="space-y-2">
            <InputField
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              error={error}
              required
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Sign Up */}
        <p className="text-center mt-6 text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-primary hover:underline"
          >
            Sign up
          </button>
        </p>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Button onClick={() => navigate("/")} variant="link" size="sm">
            ← Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
