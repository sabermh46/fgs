// app/dashboard/loading.tsx
import { Loader2 } from "lucide-react"; // Assuming 'lucide-react' is installed

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
    </div>
  );
}