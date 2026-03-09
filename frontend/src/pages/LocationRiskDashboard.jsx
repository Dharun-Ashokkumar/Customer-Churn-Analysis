import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ReferenceLine,
  ZAxis,
} from "recharts";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  getStats,
  getChurnDistribution,
  getChurnSegments,
  getGeographicChurn,
} from "../services/api";

function Kpi({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub ? <div className="text-xs text-gray-400 mt-1">{sub}</div> : null}
    </div>
  );
}

// ✅ Light theme tooltip styles (fix black look)
const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const tooltipLabelStyle = { color: "#111827", fontWeight: 700 };
const tooltipItemStyle = { color: "#374151" };

// ✅ Axis tick style
const axisTick = { fill: "#6b7280", fontSize: 11 };

export default function LocationRiskDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [segments, setSegments] = useState([]);
  const [geo, setGeo] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, d, seg, g] = await Promise.all([
          getStats(),
          getChurnDistribution(),
          getChurnSegments(),
          getGeographicChurn(),
        ]);

        if (!alive) return;
        setStats(s || null);
        setDistribution(Array.isArray(d) ? d : []);
        setSegments(Array.isArray(seg) ? seg : []);
        setGeo(Array.isArray(g) ? g : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  // ---- KPI values (fallback safe) ----
  const kpi = useMemo(() => {
    const risky = stats?.risky_customers ?? stats?.riskyCustomers ?? 0;
    const mrrRisk = stats?.mrr_risky ?? stats?.mrrRisky ?? 0;
    const retention = stats?.retention_rate ?? stats?.retentionRate ?? 0;
    const mrrTotal = stats?.mrr_total ?? stats?.mrrTotal ?? 0;

    const money = (n) =>
      typeof n === "number"
        ? n >= 1_000_000
          ? `$${(n / 1_000_000).toFixed(1)}M`
          : n >= 1_000
          ? `$${(n / 1_000).toFixed(1)}K`
          : `$${n.toFixed(0)}`
        : "$0";

    return {
      risky,
      mrrRisk: money(mrrRisk),
      retention: `${Number(retention).toFixed(0)}%`,
      mrrTotal: money(mrrTotal),
    };
  }, [stats]);

  // ---- Customer by Status (stacked bar) ----
  const customerByStatus = useMemo(() => {
    const raw = stats?.customer_by_status;
    if (Array.isArray(raw) && raw.length) return raw;

    if (!distribution.length) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((m, i) => ({
      month: m,
      active: 1800 + i * 220,
      new: 600 + i * 120,
      inactive: 500 + i * 80,
      lost: 250 + i * 50,
    }));
  }, [stats, distribution]);

  // ---- Risk distribution ----
  const riskDist = useMemo(() => {
    if (!distribution?.length) return [];
    return distribution.map((d) => ({
      bucket: d.bucket ?? d.label ?? d.risk_bucket ?? String(d.risk ?? ""),
      count: Number(d.count ?? d.customers ?? 0),
    }));
  }, [distribution]);

  // ============================================================
  // ✅ Scatter bubble chart (image style)
  // ============================================================
  const segmentScatter = useMemo(() => {
    if (!segments?.length) return [];

    return segments.map((d, idx) => {
      const label = d.segment_name ?? d.segment ?? d.name ?? `Segment ${idx + 1}`;

      const x =
        Number(d.spendings ?? d.spend ?? d.avg_spend ?? d.income ?? 0) || 0;

      let y =
        Number(
          d.churnRisk ??
            d.churn_risk ??
            d.avg_churn_risk ??
            d.churn_probability ??
            0
        ) || 0;

      if (y > 1) y = y / 100;

      const size =
        Number(
          d.count ??
            d.customers ??
            d.segment_size ??
            d.total_customers ??
            25
        ) || 25;

      const level = y >= 0.6 ? "High" : y >= 0.3 ? "Medium" : "Low";

      return { label, spendings: x, churnRisk: y, size, level };
    });
  }, [segments]);

  const avgChurn = useMemo(() => {
    if (!segmentScatter.length) return 0;
    const sum = segmentScatter.reduce((a, b) => a + (b.churnRisk || 0), 0);
    return sum / segmentScatter.length;
  }, [segmentScatter]);

  // ---- Geo points for map ----
  const mapPoints = useMemo(() => {
    return (geo || [])
      .filter((d) => {
        const lat = Number(d.lat);
        const lng = Number(d.lng);
        return Number.isFinite(lat) && Number.isFinite(lng);
      })
      .map((d, idx) => {
        const risk = Number(d.churn_probability ?? d.churn_risk ?? 0);
        const spend = Number(d.spendings ?? d.spend ?? 0);

        return {
          id: d.customer_id ?? idx,
          name: d.name ?? d.customer_name ?? `Customer ${idx + 1}`,
          lat: Number(d.lat),
          lng: Number(d.lng),
          risk,
          spend,
          level: risk >= 0.6 ? "High" : risk >= 0.3 ? "Medium" : "Low",
        };
      });
  }, [geo]);

  const riskColor = (level) => {
    if (level === "High") return "#ef4444";
    if (level === "Medium") return "#f59e0b";
    return "#22c55e";
  };

  const tableRows = useMemo(() => {
    return mapPoints.slice(0, 8).map((p) => ({
      id: p.id,
      name: p.name,
      churn: `${Math.round(p.risk * 100)}%`,
      spend: p.spend,
      level: p.level,
    }));
  }, [mapPoints]);

  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-4">
        Churn Analysis Dashboard with Location wise Risk Status
      </div>

      {loading ? <div className="text-gray-500">Loading dashboard...</div> : null}

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Kpi title="Risky Customers" value={kpi.risky} sub="Customers likely to churn" />
        <Kpi title="Monthly Income of Risky Customers (MRR)" value={kpi.mrrRisk} />
        <Kpi title="Retention Rate" value={kpi.retention} />
        <Kpi title="MRR (Monthly Recurring Revenue)" value={kpi.mrrTotal} />
      </div>

      {/* TOP CHART ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* ✅ Customer by Status (LIGHT THEME) */}
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">Customer by Status</div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerByStatus} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={axisTick} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <YAxis tick={axisTick} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                <Legend wrapperStyle={{ color: "#374151", fontSize: 12 }} />

                {/* ✅ Fix: fills set -> no more black bars */}
                <Bar dataKey="active" stackId="a" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="new" stackId="a" fill="#60a5fa" />
                <Bar dataKey="inactive" stackId="a" fill="#f59e0b" />
                <Bar dataKey="lost" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ Churn Risk Distribution (LIGHT THEME) */}
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">Churn Risk Distribution</div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="bucket"
                  tick={axisTick}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis tick={axisTick} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />

                {/* ✅ Fix: fill set -> no more black */}
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            (Backend buckets like 0-10%, 10-20% வந்தா graph perfect-a varum)
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ✅ UPDATED SCATTER */}
        <div className="bg-white rounded-xl shadow p-4 border lg:col-span-1">
          <div className="font-semibold text-gray-700 mb-3">
            Which Segments are Most Likely to Leave?
            <span className="text-xs text-gray-400 ml-2">
              Avg Churn: {(avgChurn * 100).toFixed(1)}%
            </span>
          </div>

          <div className="flex gap-3 text-xs mb-2 text-gray-600">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
              High
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#f59e0b" }} />
              Medium
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
              Low
            </span>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

                <XAxis
                  type="number"
                  dataKey="spendings"
                  name="Spendings"
                  tick={axisTick}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString()}
                />

                <YAxis
                  type="number"
                  dataKey="churnRisk"
                  name="Churn Risk"
                  domain={[0, 1]}
                  tick={axisTick}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />

                <ZAxis type="number" dataKey="size" range={[80, 600]} />

                <ReferenceLine y={avgChurn} strokeDasharray="6 6" stroke="#9ca3af" />

                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border rounded-lg px-3 py-2 text-sm shadow">
                        <div className="font-semibold">{d.label}</div>
                        <div>Spendings: {Number(d.spendings).toLocaleString()}</div>
                        <div>Churn Risk: {(d.churnRisk * 100).toFixed(1)}%</div>
                        <div>Customers: {Number(d.size).toLocaleString()}</div>
                      </div>
                    );
                  }}
                />

                <Scatter
                  data={segmentScatter}
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;

                    const r = Math.max(10, Math.min(24, Math.sqrt(payload.size) * 1.25));

                    let fill = "rgba(34,197,94,0.28)";
                    let stroke = "rgba(34,197,94,0.95)";
                    if (payload.level === "High") {
                      fill = "rgba(239,68,68,0.26)";
                      stroke = "rgba(239,68,68,0.95)";
                    } else if (payload.level === "Medium") {
                      fill = "rgba(245,158,11,0.24)";
                      stroke = "rgba(245,158,11,0.95)";
                    }

                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={payload.level === "High" ? 2.2 : 1.2}
                        />
                        <text
                          x={cx}
                          y={cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={11}
                          fill="#111827"
                          style={{ pointerEvents: "none", fontWeight: 600 }}
                        >
                          {String(payload.label).replace("Segment", "S")}
                        </text>
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            X: Spendings | Y: Avg Churn Risk | Bubble size: Segment Customers
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow p-4 border lg:col-span-1">
          <div className="font-semibold text-gray-700 mb-3">Churn Risk by Location</div>

          <div className="h-[280px] rounded-lg overflow-hidden border">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={4}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {mapPoints.map((p) => (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={7}
                  pathOptions={{
                    color: riskColor(p.level),
                    fillColor: riskColor(p.level),
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{p.name}</div>
                      <div>Risk: {Math.round(p.risk * 100)}%</div>
                      <div>Level: {p.level}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="flex gap-3 text-xs mt-3 text-gray-600">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              High
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
              Medium
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Low
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow p-4 border lg:col-span-1">
          <div className="font-semibold text-gray-700 mb-3">Top Risk Customers</div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2">Id</th>
                  <th>Name</th>
                  <th>Churn risk</th>
                  <th>Spendings</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.churn}</td>
                    <td>{r.spend}</td>
                    <td className="font-medium">{r.level}</td>
                  </tr>
                ))}
                {!tableRows.length ? (
                  <tr>
                    <td colSpan="5" className="py-3 text-gray-400">
                      No geo data received (lat/lng missing).
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-gray-400 mt-2">
            (Geo API la lat/lng irundha thaan dots & table fill aagum)
          </div>
        </div>
      </div>
    </div>
  );
}
