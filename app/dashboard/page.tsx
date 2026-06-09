import { Suspense } from "react";

import ClientDashboard from "../../components/dashboard/client-dashboard";

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<DashboardLoading />}>
        <ClientDashboard />
      </Suspense>
    </>
  );
}
