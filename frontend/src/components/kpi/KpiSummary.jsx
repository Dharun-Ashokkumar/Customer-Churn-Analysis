import KpiCard from "./KpiCard";

export default function KpiSummary({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <KpiCard title="Total Customers" value={stats.total_customers} />
      <KpiCard title="Churn Rate" value={`${stats.churn_rate}%`} />
      <KpiCard title="Retention Rate" value={`${stats.retention_rate}%`} />
      <KpiCard
        title="High Risk Customers"
        value={stats.high_risk_customers}
      />
    </div>
  );
}
