import { Link } from "react-router";
import { Button } from "../../components/ui/button";

export default function PublicNavbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          
          <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                <span className="font-bold text-white">360</span>
              </div>
              <span className="text-xl font-bold text-gray-900">360EVO</span>
            </div>

          

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Join Now</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
