import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8 relative">
          <div className="text-[150px] md:text-[200px] font-bold text-gray-200 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-full p-8 shadow-xl">
              <Search className="size-16 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
            Page Not Found
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline" 
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Home className="size-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Looking for something else?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="#" className="text-blue-600 hover:underline">
              Projects
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-blue-600 hover:underline">
              Expert Network
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-blue-600 hover:underline">
              Help Center
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8">
          <p className="text-xs text-gray-500">
            Error Code: 404 • If you believe this is a mistake, please{" "}
            <a href="#" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
