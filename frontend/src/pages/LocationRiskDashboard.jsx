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

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
};

const tooltipLabelStyle = { color: "#111827", fontWeight: 700 };
const tooltipItemStyle = { color: "#374151" };

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

  // ✅ KPI FIX
  const kpi = useMemo(() => {
    const risky = stats?.high_risk_customers ?? 0;
    const retention = stats?.retention_rate ?? 0;

    return {
      risky,
      retention: `${Number(retention).toFixed(0)}%`,
    };
  }, [stats]);

  // ---- Customer by Status ----
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
      bucket: d.bucket,
      count: Number(d.count ?? 0),
    }));
  }, [distribution]);

  // ✅ SCATTER FIX
  const segmentScatter = useMemo(() => {
    if (!segments?.length) return [];

    return segments.map((d, idx) => {
      const label = `S${idx + 1}`;

      const x = Number(d.customers ?? 0);

      let y = Number(d.avg_risk ?? 0);
      if (y > 1) y = y / 100;
      y = Math.min(Math.max(y, 0), 1);

      const size = Number(d.customers ?? 20);

      const level =
        y >= 0.7 ? "High" :
        y >= 0.6 ? "Medium" :
        "Low";

      return { label, spendings: x, churnRisk: y, size, level };
    });
  }, [segments]);

  const avgChurn = useMemo(() => {
    if (!segmentScatter.length) return 0;
    const sum = segmentScatter.reduce((a, b) => a + b.churnRisk, 0);
    return sum / segmentScatter.length;
  }, [segmentScatter]);

  // ✅ MAP FIX (NO HARDCODE + JITTER)
  const mapPoints = useMemo(() => {
    return (geo || [])
      .filter((d) => Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng)))
      .map((d, idx) => {
        const risk = Number(d.churn_probability ?? 0);

        return {
          id: d.customer_id ?? idx,
          name: d.name ?? `Customer ${idx + 1}`,
          lat: Number(d.lat) + (Math.random() - 0.5) * 0.5,
          lng: Number(d.lng) + (Math.random() - 0.5) * 0.5,
          risk,
          spend: Number(d.spendings ?? 0),
          level: d.risk_level, // ✅ backend
        };
      });
  }, [geo]);

  const riskColor = (level) => {
    if (level === "High") return "#ef4444";
    if (level === "Medium") return "#f59e0b";
    return "#22c55e";
  };

  const tableRows = useMemo(() => {
    const sorted = [...mapPoints]
      .sort((a, b) => {
        // 🔥 Priority: High > Medium > Low
        const priority = { High: 3, Medium: 2, Low: 1 };

        if (priority[b.level] !== priority[a.level]) {
          return priority[b.level] - priority[a.level];
        }

        // 🔥 Then sort by probability
        return b.risk - a.risk;
      })
      .slice(0, 8);

    return sorted.map((p) => ({
      id: p.id,
      name: p.name,
      churn: `${Math.round(p.risk * 100)}%`,
      level: p.level,
    }));
  }, [mapPoints]);
  return (
    <div className="p-6">
      <div className="text-2xl font-semibold mb-4">
        Churn Analysis Dashboard with Location wise Risk Status
      </div>

      {loading && <div className="text-gray-500">Loading dashboard...</div>}

      {/* ✅ KPI UPDATED */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Kpi title="Risky Customers" value={kpi.risky} sub="Customers likely to churn" />
        <Kpi title="Retention Rate" value={kpi.retention} />
      </div>

      {/* TOP CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">Customer by Status</div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="active" stackId="a" fill="#2563eb" />
                <Bar dataKey="new" stackId="a" fill="#60a5fa" />
                <Bar dataKey="inactive" stackId="a" fill="#f59e0b" />
                <Bar dataKey="lost" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">Churn Risk Distribution</div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* SCATTER */}
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">
            Which Segments are Most Likely to Leave? (Avg {(avgChurn * 100).toFixed(1)}%)
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="spendings" />
                <YAxis dataKey="churnRisk" domain={[0, 1]} />
                <ZAxis dataKey="size" range={[80, 400]} />
                <ReferenceLine y={avgChurn} stroke="gray" />
                <Tooltip />
                <Scatter data={segmentScatter} fill="#2563eb" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MAP */}
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">Churn Risk by Location</div>

          <div className="h-[280px]">
            <MapContainer center={[20, 78]} zoom={4} style={{ height: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapPoints.map((p) => (
                <CircleMarker
                  key={p.id}
                  center={[p.lat, p.lng]}
                  radius={6}
                  pathOptions={{
                    color: riskColor(p.level),
                    fillColor: riskColor(p.level),
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup>
                    {p.name} <br />
                    Risk: {Math.round(p.risk * 100)}% <br />
                    Level: {p.level}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow p-4 border">
          <div className="font-semibold text-gray-700 mb-3">Top Risk Customers</div>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Churn</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.churn}</td>
                  <td>{r.risky ? 'Low' : 'High'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}