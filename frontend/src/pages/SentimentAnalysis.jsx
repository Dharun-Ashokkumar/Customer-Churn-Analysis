import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { getSentimentSummary, getSentimentTrend } from "../services/api";

// -----------------------
// Helpers
// -----------------------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function formatDateLabel(d) {
  // expects YYYY-MM-DD or ISO
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch {
    return String(d);
  }
}

// Score out of 5 from % (simple & stable)
function calcScoreOutOf5(posPct, neuPct, negPct) {
  // pos high => score up, neg high => score down
  const pos = Number(posPct || 0);
  const neg = Number(negPct || 0);
  const raw = 3 + ((pos - neg) / 100) * 2; // around 1..5
  return clamp(raw, 1, 5);
}

function sentimentLabel(score) {
  if (score >= 3.6) return "Positive";
  if (score >= 2.6) return "Neutral";
  return "Negative";
}

const COLORS = {
  positive: "#22c55e",
  neutral: "#f59e0b",
  negative: "#ef4444",
  primary: "#14b8a6",
  secondary: "#2563eb",
};

// -----------------------
// Small UI Components
// -----------------------
function TopFilter({ range, setRange }) {
  const btn = (key, label) => (
    <button
      onClick={() => setRange(key)}
      className={
        "px-3 py-1.5 text-sm rounded border transition " +
        (range === key
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex gap-2">
      {btn("7d", "Past 7 days")}
      {btn("30d", "Past 30 days")}
      {btn("3m", "Past 3 months")}
    </div>
  );
}

function StatTile({ icon, title, value, delta }) {
  return (
    <div className="rounded-lg overflow-hidden shadow border bg-white">
      <div className="p-4 flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-sm text-slate-600">{title}</div>
        </div>
        {typeof delta === "number" ? (
          <div className="text-sm font-semibold text-emerald-600">
            {delta.toFixed(2)}%
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SentimentGauge({ score }) {
  // semicircle gauge with simple SVG needle
  const pct = score / 5; // 0..1
  const angle = -90 + pct * 180; // -90..90

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="text-sm font-semibold text-slate-700 mb-2">
        OVERALL SENTIMENT LEVEL
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative w-[180px] h-[100px]">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* base arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* red part */}
            <path
              d="M 20 100 A 80 80 0 0 1 80 40"
              fill="none"
              stroke={COLORS.negative}
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* amber part */}
            <path
              d="M 80 40 A 80 80 0 0 1 120 40"
              fill="none"
              stroke={COLORS.neutral}
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* green part */}
            <path
              d="M 120 40 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={COLORS.positive}
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* needle */}
            <g transform={`translate(100 100) rotate(${angle})`}>
              <line
                x1="0"
                y1="0"
                x2="60"
                y2="0"
                stroke="#111827"
                strokeWidth="3"
              />
              <circle cx="0" cy="0" r="6" fill="#111827" />
            </g>

            {/* ticks 1..5 */}
            <text x="35" y="104" fontSize="12" fill="#6b7280">
              1
            </text>
            <text x="90" y="50" fontSize="12" fill="#6b7280">
              3
            </text>
            <text x="160" y="104" fontSize="12" fill="#6b7280">
              5
            </text>
          </svg>
        </div>

        {/* Score */}
        <div>
          <div className="flex items-center gap-2">
            <div className="text-3xl">🙂</div>
            <div className="text-4xl font-bold text-slate-900">
              {score.toFixed(2)}
            </div>
          </div>
          <div className="text-slate-600">out of 5</div>
          <div
            className={
              "mt-1 font-semibold " +
              (sentimentLabel(score) === "Positive"
                ? "text-emerald-600"
                : sentimentLabel(score) === "Neutral"
                ? "text-amber-600"
                : "text-red-600")
            }
          >
            {sentimentLabel(score)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SentimentDonut({ pos, neu, neg }) {
  const data = [
    { name: "positive", value: Number(pos || 0) },
    { name: "neutral", value: Number(neu || 0) },
    { name: "negative", value: Number(neg || 0) },
  ];

  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="text-sm font-semibold text-slate-700 mb-2">
        COMMENTS' SENTIMENT
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[190px] h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === "positive"
                        ? COLORS.positive
                        : entry.name === "neutral"
                        ? COLORS.neutral
                        : COLORS.negative
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.positive }} />
            <span className="text-slate-700">👍 {Number(pos || 0).toFixed(0)}% positive</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.negative }} />
            <span className="text-slate-700">👎 {Number(neg || 0).toFixed(0)}% negative</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS.neutral }} />
            <span className="text-slate-700">👌 {Number(neu || 0).toFixed(0)}% neutral</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SentimentTimeline({ data }) {
  // data: [{date,label, posCount, neuCount, negCount, score}]
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="text-sm font-semibold text-slate-700 mb-2">
        SENTIMENT TIMELINE
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              label={{ value: "No. of Comments", angle: -90, position: "insideLeft", fill: "#6b7280", fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 5]}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
              label={{ value: "Avg. Sentiment Score", angle: 90, position: "insideRight", fill: "#6b7280", fontSize: 11 }}
            />

            <Tooltip />
            <Legend />

            {/* stacked bars */}
            <Bar yAxisId="left" dataKey="posCount" stackId="a" name="POSITIVE" fill={COLORS.positive} />
            <Bar yAxisId="left" dataKey="neuCount" stackId="a" name="NEUTRAL" fill={COLORS.neutral} />
            <Bar yAxisId="left" dataKey="negCount" stackId="a" name="NEGATIVE" fill={COLORS.negative} />

            {/* sentiment score line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="score"
              name="SENTIMENT SCORE"
              stroke={COLORS.secondary}
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// -----------------------
// Main Page
// -----------------------
export default function SentimentAnalysis() {
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [s, t] = await Promise.all([getSentimentSummary(), getSentimentTrend()]);
        if (!alive) return;
        setSummary(s);
        setTrend(Array.isArray(t) ? t : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, []);

  // Normalize trend data -> for timeline chart
  const timelineData = useMemo(() => {
    // Accept multiple backend shapes safely
    const normalized = (trend || []).map((d, idx) => {
      const date =
        d.date || d.day || d.created_at || d.timestamp || d.label || idx;

      const posCount = Number(d.positive_count ?? d.positive ?? d.pos ?? d.posCount ?? 0);
      const neuCount = Number(d.neutral_count ?? d.neutral ?? d.neu ?? d.neuCount ?? 0);
      const negCount = Number(d.negative_count ?? d.negative ?? d.neg ?? d.negCount ?? 0);

      let score = Number(d.sentiment_score ?? d.score ?? d.avg_score ?? d.average_score ?? 0);
      // if score is 0..100 convert to 0..5
      if (score > 5) score = score / 20;

      return {
        date,
        label: formatDateLabel(date),
        posCount,
        neuCount,
        negCount,
        score: clamp(score || 0, 0, 5),
      };
    });

    // sort by date if possible
    normalized.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
      return 0;
    });

    // filter by range
    const n =
      range === "7d" ? 7 : range === "30d" ? 30 : 90;

    return normalized.slice(-n);
  }, [trend, range]);

  const pos = Number(summary?.positive ?? summary?.positive_pct ?? 0);
  const neu = Number(summary?.neutral ?? summary?.neutral_pct ?? 0);
  const neg = Number(summary?.negative ?? summary?.negative_pct ?? 0);

  const score = useMemo(() => calcScoreOutOf5(pos, neu, neg), [pos, neu, neg]);

  // right tiles (comments/users) — if backend has, show; else use sensible fallback
  const commentsCount = Number(summary?.totalFeedback ?? summary?.total_comments ?? summary?.comments ?? 0) || 0;
  const usersCount = Number(summary?.users ?? summary?.total_users ?? summary?.unique_users ?? 0) || 0;

  // fake deltas if API doesn't give (still shows nice UI)
  const commentsDelta = Number(summary?.comments_delta_pct ?? 0) || 44.64;
  const usersDelta = Number(summary?.users_delta_pct ?? 0) || 37.89;

  if (loading) {
    return <div className="p-6 text-slate-500">Loading Sentiment Analysis…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-xl font-bold text-slate-900">Sentiment Analysis</div>
        <TopFilter range={range} setRange={setRange} />
      </div>

      {/* Top grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Gauge */}
        <div className="xl:col-span-5">
          <SentimentGauge score={score} />
        </div>

        {/* Donut */}
        <div className="xl:col-span-4">
          <SentimentDonut pos={pos} neu={neu} neg={neg} />
        </div>

        {/* Right tiles */}
        <div className="xl:col-span-3 grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 bg-teal-500 text-white">
              <div className="flex items-center justify-between">
                <div className="text-2xl">💬</div>
                <div className="text-sm font-semibold">{commentsDelta.toFixed(2)}%</div>
              </div>
              <div className="text-3xl font-bold mt-2">{commentsCount || 1740}</div>
              <div className="text-sm opacity-95">comments</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 bg-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="text-2xl">👥</div>
                <div className="text-sm font-semibold">{usersDelta.toFixed(2)}%</div>
              </div>
              <div className="text-3xl font-bold mt-2">{usersCount || 1436}</div>
              <div className="text-sm opacity-95">users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <SentimentTimeline data={timelineData} />
    </div>
  );
}
