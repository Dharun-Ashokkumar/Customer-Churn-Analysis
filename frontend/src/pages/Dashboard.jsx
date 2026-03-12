import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Smile,
  Users,
  Activity,
  Settings
} from "lucide-react";

export default function DashboardLayout() {

  const menuItem =
    "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition";

  const activeItem =
    "flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 text-white";

  return (
    <div className="flex h-screen bg-black text-white">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 p-6">

        <h1 className="text-2xl font-bold mb-10">
          Churn Analytics
        </h1>

        <nav className="flex flex-col gap-2">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? activeItem : menuItem
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              isActive ? activeItem : menuItem
            }
          >
            <BarChart3 size={18} />
            Analytics
          </NavLink>

          <NavLink
            to="/sentiment"
            className={({ isActive }) =>
              isActive ? activeItem : menuItem
            }
          >
            <Smile size={18} />
            Sentiment Analysis
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              isActive ? activeItem : menuItem
            }
          >
            <Users size={18} />
            Customer Risk
          </NavLink>

          {/* ⭐ NEW PREDICTION PAGE */}
          <NavLink
            to="/predict"
            className={({ isActive }) =>
              isActive ? activeItem : menuItem
            }
          >
            <Activity size={18} />
            Prediction
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? activeItem : menuItem
            }
          >
            <Settings size={18} />
            Settings
          </NavLink>

        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8 bg-[#0f172a]">
        <Outlet />
      </main>

    </div>
  );
}