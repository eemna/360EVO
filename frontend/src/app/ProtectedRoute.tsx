import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8eef5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <span className="font-bold text-white">360</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg
              className="animate-spin h-4 w-4 text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading...
          </div>
        </div>
      </div>
    );
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}