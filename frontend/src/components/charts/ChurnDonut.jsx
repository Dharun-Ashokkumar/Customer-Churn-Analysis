import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect,useState } from "react";
import { getStats } from "../../services/api";

export default function ChurnDonut({}) {
  const [data, setData] = useState([]);

  useEffect(() => {
    getStats().then(d => {
      setData([
        { name: "Churned", value: d.churn_rate },
        { name: "Retained", value: d.retention_rate },
      ]);
    });
  }, []);
  const COLORS = ["#ef4444", "#22c55e"];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-4">
        Churn Distribution
      </h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            innerRadius={70}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1200}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
