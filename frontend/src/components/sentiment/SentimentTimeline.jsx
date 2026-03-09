import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// ✅ helper: date label short (18-Jan)
function fmtLabel(v) {
  if (!v) return "";
  if (typeof v === "string" && v.includes("-") && v.length <= 7) return v;

  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return String(v);

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  return `${day}-${mon}`;
}

// ✅ tooltip style (white)
const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

export default function SentimentTimeline({ trends = [] }) {
  const data = (Array.isArray(trends) ? trends : [])
    .map((d, i) => {
      const date =
        d.date ??
        d.day ??
        d.created_at ??
        d.month ??
        d.label ??
        d.time ??
        i;

      const positive = Number(
        d.positive ?? d.pos ?? d.Positive ?? d.positive_count ?? 0
      );
      const neutral = Number(
        d.neutral ?? d.neu ?? d.Neutral ?? d.neutral_count ?? 0
      );
      const negative = Number(
        d.negative ?? d.neg ?? d.Negative ?? d.negative_count ?? 0
      );

      let score = Number(d.score ?? d.sentiment_score ?? d.avg_score ?? 0);

      if (score > 0 && score <= 1) score = 1 + score * 4;

      if (!score && (positive + neutral + negative) > 0) {
        const total = positive + neutral + negative;
        score = (positive * 5 + neutral * 3 + negative * 1) / total;
      }

      return {
        dateLabel: fmtLabel(date),
        positive,
        neutral,
        negative,
        score,
        total: positive + neutral + negative,
      };
    })
    .filter((x) => x.dateLabel);

  const hasAny = data.some((d) => d.total > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border">
      <h3 className="text-lg font-semibold text-black mb-4">
        SENTIMENT TIMELINE
      </h3>

      {!hasAny ? (
        <div className="text-sm text-gray-500">
          Timeline data varala. Backend la day-wise/month-wise sentiment counts
          (positive/neutral/negative) send panna chart correct-a varum.
        </div>
      ) : (
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 40, left: 10, bottom: 10 }}
            >
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#374151", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                interval="preserveStartEnd"
              />

              <YAxis
                yAxisId="left"
                tick={{ fill: "#374151", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                label={{
                  value: "No. of Comments",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#6b7280", fontSize: 11 },
                }}
              />

              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[1, 5]}
                tick={{ fill: "#374151", fontSize: 11 }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
                label={{
                  value: "Avg. Sentiment Score",
                  angle: 90,
                  position: "insideRight",
                  style: { fill: "#6b7280", fontSize: 11 },
                }}
              />

              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#111827", fontWeight: 700 }}
                itemStyle={{ color: "#374151" }}
                formatter={(value, name) => {
                  if (name === "score") return [Number(value).toFixed(2), "Score"];
                  return [value, name];
                }}
              />

              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => {
                  const map = {
                    positive: "Positive",
                    neutral: "Neutral",
                    negative: "Negative",
                    score: "Score",
                  };
                  return (
                    <span
                      style={{
                        color: "#111827",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {map[value] ?? value}
                    </span>
                  );
                }}
              />

              <Bar yAxisId="left" dataKey="positive" stackId="a" fill="#22c55e" name="positive" />
              <Bar yAxisId="left" dataKey="neutral" stackId="a" fill="#facc15" name="neutral" />
              <Bar yAxisId="left" dataKey="negative" stackId="a" fill="#ef4444" name="negative" />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 3, fill: "#2563eb" }}
                activeDot={{ r: 5 }}
                name="score"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
