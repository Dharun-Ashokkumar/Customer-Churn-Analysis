import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SegmentScatter({ data = [] }) {

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-gray-500 text-sm">
          No segment data available
        </p>
      </div>
    );
  }

  // Normalize for scatter chart
  const scatterData = data.map((s) => ({
    x: s.customers,
    y: Math.round(s.avg_risk * 100),
    cluster: s.cluster_id,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-4">
        Segment Risk Scatter
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart>
          <XAxis
            type="number"
            dataKey="x"
            name="Customers"
            label={{ value: "Customers", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Risk %"
            label={{ value: "Risk (%)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter
            data={scatterData}
            fill="#f59e0b"
            animationDuration={1200}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
