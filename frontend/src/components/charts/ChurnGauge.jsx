import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

export default function ChurnGauge({ value }) {
  const percent = Math.round((value ?? 0) * 100);

  const data = [{ name: "Churn", value: percent }];


  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-4">Churn Risk Gauge</h3>

      <ResponsiveContainer width="100%" height={250}>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            minAngle={15}
            background
            clockWise
            dataKey="value"
            fill={percent > 60 ? "#ef4444" : percent > 30 ? "#f59e0b" : "#22c55e"}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="text-center text-xl font-bold text-gray-800">
        {percent}%
      </div>
    </div>
  );
}
