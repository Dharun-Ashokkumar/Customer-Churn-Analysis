import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";


export default function SentimentTrend({data = [] }) {
  if(!data.length) return null;
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-black mb-4">
        Sentiment Trend
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

          <XAxis
            dataKey="month"
            stroke="#000"
            tick={{ fill: "#000" }}
          />

          <YAxis
            stroke="#000"
            tick={{ fill: "#000" }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="count"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ fill: "#22c55e" }}
            animationDuration={1200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
