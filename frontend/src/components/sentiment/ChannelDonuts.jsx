import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  positive: "#22c55e",
  neutral: "#f59e0b",
  negative: "#ef4444",
};

export default function ChannelDonuts({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-gray-500 text-sm">
          No channel data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-6">
        Channel Distribution
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map((channel) => {
          // ✅ Normalize percentages into chart-ready data
          const pieData = [
            { name: "Positive", value: channel.positive },
            { name: "Neutral", value: channel.neutral },
            { name: "Negative", value: channel.negative },
          ];

          return (
            <div
              key={channel.channel}
              className="flex flex-col items-center"
            >
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {channel.channel}
              </h4>

              <div className="w-full h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[entry.name.toLowerCase()]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {channel.total} feedback
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
