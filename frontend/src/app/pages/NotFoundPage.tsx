import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="text-[120px] md:text-[180px] font-bold text-white/10 leading-none select-none mb-4">
          404
        </div>

        <div className="space-y-4 mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            This Page Didn't Match. Let's Find You a Better Connection.
          </h1>
          <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist — but the right one
            probably does.
          </p>
        </div>

        <Link
          to="/"
          className="inline-block px-8 py-4 bg-[#C9A84C] text-[#0D1B2A] rounded-xl hover:bg-[#D4B55C] transition-colors font-medium"
        >
          Back to Home →
        </Link>
      </div>
    </div>
  );
}
