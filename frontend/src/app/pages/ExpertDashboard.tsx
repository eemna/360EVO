import { Users } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

export function ExpertDashboard() {
  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          Expert Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Your consultations, expertise and professional activity
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="flex items-center justify-center py-20">
        <Card className="bg-white shadow-lg max-w-md w-full">
          <CardContent className="py-16 px-8 text-center">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Users className="size-10 text-blue-600" />
            </div>

            <h2 className="text-3xl font-semibold text-gray-900 mb-3">
              Coming Soon
            </h2>

            <p className="text-gray-600">
              Expert dashboard features are currently under development.
              Soon you will be able to manage your consultations, client
              requests and professional services here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}