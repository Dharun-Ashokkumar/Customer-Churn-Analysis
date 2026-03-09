import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow border">
      <div className="px-5 py-4 border-b">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

export default function CustomerRiskDashboard() {
  // 🔥 demo data (later api/dataset connect pannalam)
  const gaugeSegments = useMemo(
    () => [
      { name: "Low", value: 25, color: "#083344" },
      { name: "Med", value: 25, color: "#155e75" },
      { name: "High", value: 25, color: "#0284c7" },
      { name: "Critical", value: 25, color: "#7dd3fc" },
    ],
    []
  );

  const raaDist = useMemo(
    () => [
      { name: "Low", value: 22, color: "#7dd3fc" },
      { name: "Medium", value: 38, color: "#38bdf8" },
      { name: "High", value: 28, color: "#0284c7" },
      { name: "Critical", value: 12, color: "#075985" },
    ],
    []
  );

  const strategies = useMemo(
    () => [
      { name: "Strategy 4", resolved: 7, inProgress: 4, new: 3 },
      { name: "Strategy 3", resolved: 6, inProgress: 3, new: 4 },
      { name: "Strategy 2", resolved: 5, inProgress: 5, new: 3 },
      { name: "Strategy 1", resolved: 4, inProgress: 4, new: 6 },
    ],
    []
  );

  const heat1 = useMemo(
    () => [
      [2, 3, 4, 4, 5],
      [2, 2, 3, 4, 4],
      [1, 2, 3, 3, 4],
      [1, 1, 2, 3, 3],
    ],
    []
  );

  const heat2 = useMemo(
    () => [
      [1, 2, 3, 4, 4],
      [1, 2, 2, 3, 4],
      [1, 1, 2, 3, 3],
      [1, 1, 2, 2, 3],
    ],
    []
  );

  const tableRows = useMemo(
    () => [
      { score: 16, area: "Ownership", activity: "Can legally form a business entity", who: "JP", when: "10/11" },
      { score: 16, area: "Business", activity: "Ability to easily complete transactions", who: "HG", when: "12/11" },
      { score: 15, area: "Cross border transactions", activity: "Frequent transactions across borders", who: "FD", when: "02/12" },
      { score: 8, area: "Money laundering", activity: "Funds deposited into account at many locations", who: "RT", when: "06/12" },
      { score: 8, area: "Cash transactions", activity: "Unrestricted deposits and withdrawals", who: "RT", when: "06/12" },
    ],
    []
  );

  // semicircle gauge effect: use PieChart with start/end angle
  const gaugeNeedleAngle = 210; // just demo; later risk score -> angle compute

  return (
    <div className="space-y-6">
      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-light text-slate-900">
          Customer risk assessment dashboard reporting
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-5xl">
    
        </p>
      </div>

      {/* TOP BAR */}
      <div className="bg-slate-100 rounded-xl px-4 py-3 border text-center font-semibold text-slate-700">
        Customer risk dashboard
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Gauge card */}
          <Card title="Risk summary">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeSegments}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    innerRadius="65%"
                    outerRadius="95%"
                    paddingAngle={2}
                  >
                    {gaugeSegments.map((s, idx) => (
                      <Cell key={idx} fill={s.color} />
                    ))}
                  </Pie>

                  {/* Needle (simple) */}
                  <g>
                    <circle cx="50%" cy="72%" r="8" fill="#e5e7eb" stroke="#94a3b8" />
                    <line
                      x1="50%"
                      y1="72%"
                      x2="78%"
                      y2="55%"
                      stroke="#0f172a"
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform="rotate(-35 200 160)"
                    />
                  </g>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Strategy bars */}
          <Card title="Risk summary">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategies} layout="vertical" margin={{ left: 30, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="resolved" stackId="a" fill="#0f172a" />
                  <Bar dataKey="inProgress" stackId="a" fill="#1e40af" />
                  <Bar dataKey="new" stackId="a" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* RIGHT SIDE (2 columns wide) */}
        <div className="xl:col-span-2">
          <Card title="Risk profile & detail">
            {/* MINI CHART ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Heat 1 */}
              <div className="border rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Risk scoring</div>
                <HeatGrid grid={heat1} />
              </div>

              {/* Heat 2 */}
              <div className="border rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">Score distribution</div>
                <HeatGrid grid={heat2} />
              </div>

              {/* Pie */}
              <div className="border rounded-xl p-3">
                <div className="text-xs font-semibold text-slate-600 mb-2">RAA distribution</div>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={raaDist} dataKey="value" innerRadius="50%" outerRadius="90%">
                        {raaDist.map((s, idx) => (
                          <Cell key={idx} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="mt-5 overflow-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-sky-500 text-white">
                  <tr>
                    <th className="p-3 text-left">Score</th>
                    <th className="p-3 text-left">Area</th>
                    <th className="p-3 text-left">Activity</th>
                    <th className="p-3 text-left">Who</th>
                    <th className="p-3 text-left">When</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{r.score}</td>
                      <td className="p-3">{r.area}</td>
                      <td className="p-3">{r.activity}</td>
                      <td className="p-3">{r.who}</td>
                      <td className="p-3">{r.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-xs text-slate-400 text-center">
        (Later backend/dataset connect panna data auto-change aagum)
      </div>
    </div>
  );
}

function HeatGrid({ grid = [] }) {
  const colors = ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0ea5e9"];
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid?.[0]?.length || 5}, 1fr)` }}>
      {grid.flat().map((v, i) => {
        const idx = Math.max(0, Math.min(colors.length - 1, (v || 1) - 1));
        return (
          <div
            key={i}
            className="aspect-[2/1] rounded"
            style={{ background: colors[idx] }}
            title={`Score: ${v}`}
          />
        );
      })}
    </div>
  );
}
