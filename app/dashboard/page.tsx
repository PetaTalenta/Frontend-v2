import Dashboard from "../../dashboard";
import SimpleDashboard from "../../dashboard-simple";
import MinimalDashboard from "../../dashboard-minimal";

export default function Page() {
  console.log('Dashboard Page: Rendering dashboard page');

  // Try full dashboard first, with fallback to simple dashboard
  try {
    return <Dashboard />;
  } catch (error) {
    console.error('Dashboard Page: Full dashboard failed, using simple dashboard:', error);
    return <SimpleDashboard />;
  }
}
