import { useEffect, useState } from "react";
import axios from "axios";
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

  const [data, setData] = useState([]);

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    axios
      .get(`${API_BASE}/customers`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  // 🔥 RISK COUNT
  const riskCounts = {
    Low: 0,
    Medium: 0,
    High: 0,
  };

  data.forEach((d) => {
    if (d.risk_level) {
      riskCounts[d.risk_level]++;
    }
  });

  // 🔥 PIE DATA
  const raaDist = [
    { name: "Low", value: riskCounts.Low, color: "#22c55e" },
    { name: "Medium", value: riskCounts.Medium, color: "#f59e0b" },
    { name: "High", value: riskCounts.High, color: "#ef4444" },
  ];

  // 🔥 SIMPLE STRATEGY MOCK (can later connect backend)
  const strategies = [
    { name: "Low Risk", resolved: riskCounts.Low, inProgress: 2, new: 1 },
    { name: "Medium Risk", resolved: riskCounts.Medium, inProgress: 3, new: 2 },
    { name: "High Risk", resolved: riskCounts.High, inProgress: 4, new: 3 },
  ];

  return (
    <div className="space-y-6">

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Customer Risk Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Real-time churn risk analysis based on model predictions.
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="space-y-6">

          {/* PIE */}
          <Card title="Risk Distribution">
            <div className="h-[250px]">
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
          </Card>

          {/* BAR */}
          <Card title="Risk Strategy Overview">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategies}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="resolved" fill="#22c55e" />
                  <Bar dataKey="inProgress" fill="#f59e0b" />
                  <Bar dataKey="new" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

        {/* RIGHT */}
        <div className="xl:col-span-2">

          <Card title="Top Risk Customers">

            <div className="overflow-auto">
              <table className="w-full text-sm">

                <thead className="bg-slate-800 text-white">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Order Value</th>
                    <th className="p-3 text-left">Rating</th>
                    <th className="p-3 text-left">Churn %</th>
                    <th className="p-3 text-left">Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {data.slice(0, 10).map((r, i) => (

                    <tr key={i} className="border-b hover:bg-gray-50">

                      <td className="p-3">{r.customer_id}</td>

                      <td className="p-3">{r.avg_order_value}</td>

                      <td className="p-3">{r.avg_rating}</td>

                      <td className="p-3">
                        {(r.churn_probability * 100).toFixed(0)}%
                      </td>

                      <td
                        className={`p-3 font-semibold ${
                          r.risk_level === "High"
                            ? "text-red-500"
                            : r.risk_level === "Medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {r.risk_level}
                      </td>

                    </tr>

                  ))}
                </tbody>

              </table>
            </div>

          </Card>

        </div>

      </div>

    </div>
  );
}