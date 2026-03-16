import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  Users,
  Settings,
  Smile,
  Activity
} from "lucide-react";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
    isActive ? "bg-white/10 text-green-400" : "hover:text-green-400"
  }`;

export default function Sidebar() {
  return (
    <aside className="w-64 bg-black text-white min-h-screen p-6">

      <h1 className="text-xl font-bold mb-10">
        Churn Analytics
      </h1>

      <nav className="space-y-2">

        <NavLink to="/" className={linkClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <NavLink to="/analytics" className={linkClass}>
          <BarChart2 size={18} />
          Feedback Analytics
        </NavLink>

        <NavLink to="/sentiment" className={linkClass}>
          <Smile size={18} />
          Sentiment Analysis
        </NavLink>

        <NavLink to="/customers" className={linkClass}>
          <Users size={18} />
          Customer Risk
        </NavLink>

        {/* ⭐ NEW PREDICTION MENU */}
        <NavLink to="/predict" className={linkClass}>
          <Activity size={18} />
          Prediction
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          <Settings size={18} />
          Settings
        </NavLink>

      </nav>

    </aside>
  );
}