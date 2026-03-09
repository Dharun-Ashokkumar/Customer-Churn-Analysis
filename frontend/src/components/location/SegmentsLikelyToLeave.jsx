import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { getChurnSegments } from "../../services/api";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-white border rounded-lg px-3 py-2 text-sm shadow">
      <div className="font-semibold">{d.label}</div>
      <div>Avg Churn Risk: {(d.y * 100).toFixed(1)}%</div>
      <div>Spendings: {Number(d.x).toLocaleString()}</div>
      <div>Customers: {d.size}</div>
    </div>
  );
}

export default function SegmentsLikelyToLeave() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getChurnSegments().then((res = []) => {
      // ✅ Works even if keys vary (safe mapping)
      const cleaned = (Array.isArray(res) ? res : []).map((d, i) => {
        const label =
          d.segment_name ??
          d.segment ??
          d.name ??
          `Segment ${d.segment_id ?? i + 1}`;

        const x =
          Number(d.spendings ?? d.avg_spendings ?? d.avg_spending ?? d.avg_income ?? 0) || 0;

        const y =
          Number(
            d.churn_risk ??
              d.avg_churn_risk ??
              d.churn_probability ??
              d.avg_churn_probability ??
              0
          ) || 0;

        const size =
          Number(d.count ?? d.customers ?? d.segment_size ?? d.total_customers ?? 30) || 30;

        return { label, x, y, size };
      });

      setRows(cleaned);
    });
  }, []);

  // Average churn line (like image dotted line)
  const avgChurn = useMemo(() => {
    if (!rows.length) return 0;
    const s = rows.reduce((a, b) => a + (Number(b.y) || 0), 0);
    return s / rows.length;
  }, [rows]);

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-800">
          Which Segments are Most Likely to Leave?
        </h3>
        <div className="text-xs text-gray-500">
          Avg Churn: {(avgChurn * 100).toFixed(1)}%
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              type="number"
              dataKey="x"
              name="Spendings"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Avg Churn Risk"
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 11 }}
            />

            {/* ✅ Dotted Avg churn line like image */}
            <ReferenceLine
              y={avgChurn}
              strokeDasharray="5 5"
            />

            <Tooltip content={<CustomTooltip />} />

            {/* ✅ Bubble size based on segment size */}
            <Scatter
              data={rows}
              shape={(props) => {
                const { cx, cy, payload } = props;
                const r = Math.max(6, Math.min(22, Math.sqrt(payload.size) * 1.4));
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={r} fill="rgba(59,130,246,0.35)" />
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dy={4}
                      fontSize={10}
                      fill="#111827"
                    >
                      {payload.label}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        X-axis: Spendings | Y-axis: Avg Churn Risk | Bubble size: Segment Customers
      </div>
    </div>
  );
}
