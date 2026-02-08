import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RiskDistribution({ data = [] }) {

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-gray-500 text-sm">
          No risk distribution data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-4">
        Risk Distribution
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
