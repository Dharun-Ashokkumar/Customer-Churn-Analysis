import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function SentimentTrend({ data = [] }) {
  // ✅ Normalize data so chart won't go blank
  const rows = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const toNum = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0;
      return n;
    };

    // convert 70 -> 0.7 if percent values
    const to01 = (v) => {
      const n = toNum(v);
      return n > 1 ? n / 100 : n;
    };

    return data.map((d, i) => {
      const month =
        d.month ??
        d.date ??
        d.day ??
        d.label ??
        d.time ??
        `T${i + 1}`;

      // ✅ if backend gives only "count", use it. else use positive/neutral/negative
      const count = d.count ?? d.value ?? d.total ?? null;

      return {
        month: String(month),
        count: count !== null ? toNum(count) : undefined,
        positive: to01(d.positive ?? d.pos ?? d.positive_pct),
        neutral: to01(d.neutral ?? d.neu ?? d.neutral_pct),
        negative: to01(d.negative ?? d.neg ?? d.negative_pct),
      };
    });
  }, [data]);

  if (!rows.length) return null;

  // ✅ Decide: show single line (count) OR 3 lines (pos/neu/neg)
  const hasCount = rows.some((r) => typeof r.count === "number");

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border">
      <h3 className="text-lg font-semibold text-black mb-4">
        Sentiment Trend
      </h3>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

            <XAxis dataKey="month" stroke="#000" tick={{ fill: "#000" }} />
            <YAxis stroke="#000" tick={{ fill: "#000" }} />

            <Tooltip />
            {!hasCount && <Legend />}

            {/* ✅ If API gives count → same as your current line */}
            {hasCount ? (
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: "#22c55e" }}
                animationDuration={1200}
              />
            ) : (
              <>
                {/* ✅ If API gives pos/neu/neg → image style multi-line */}
                <Line
                  type="monotone"
                  dataKey="positive"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={false}
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={false}
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                  animationDuration={1200}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
