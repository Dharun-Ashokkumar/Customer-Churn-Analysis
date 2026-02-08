import { useState, useEffect } from "react";
import {
  getStats,
  getChurnDistribution,
  getChurnSegments,
  getChurnTrend,
  getGeographicChurn,
} from "../services/api";

import KpiSummary from "../components/kpi/KpiSummary";
import ChurnGauge from "../components/charts/ChurnGauge";
import ChurnDonut from "../components/charts/ChurnDonut";
import ChurnTrend from "../components/charts/ChurnTrend";
import RiskDistribution from "../components/charts/RiskDistribution";
import SegmentScatter from "../components/charts/SegmentScatter";
import GeographicChurnMap from "../components/charts/GeographicChurnMap";
import Recommendations from "../components/recommendation/Recommendations";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [riskDist, setRiskDist] = useState([]);
  const [segments, setSegments] = useState([]);
  const [trend, setTrend] = useState([]);
  const [geo, setGeo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats(),
      getChurnDistribution(),
      getChurnSegments(),
      getChurnTrend(),
      getGeographicChurn(),
    ]).then(
      ([statsRes, distRes, segmentRes, trendRes, geoRes]) => {
        setStats(statsRes);
        setRiskDist(distRes);
        setSegments(segmentRes);
        setTrend(trendRes);
        setGeo(geoRes);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-sm">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI SUMMARY */}
      <KpiSummary result={stats} />

      {/* GAUGE + DONUT */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChurnGauge value={stats.churn_rate / 100} />
        <ChurnDonut value={stats.churn_rate / 100} />
      </div>

      {/* RISK + SEGMENTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RiskDistribution data={riskDist} />
        <SegmentScatter data={segments} />
      </div>

      {/* TREND + MAP */}
      <ChurnTrend data={trend} />
      <GeographicChurnMap data={geo} />
      <Recommendations riskLevel={riskDist.risk_level} />
    </div>
  );
}
