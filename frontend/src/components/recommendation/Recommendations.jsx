import { AlertTriangle, CheckCircle, Shield } from "lucide-react";

const RISK_CONFIG = {
  High: {
    color: "bg-red-100 text-red-600",
    icon: <AlertTriangle className="text-red-500" size={24} />,
    actions: [
      "Offer immediate retention discount",
      "Assign dedicated account manager",
      "Send personalized recovery email campaign",
    ],
  },
  Medium: {
    color: "bg-yellow-100 text-yellow-600",
    icon: <Shield className="text-yellow-500" size={24} />,
    actions: [
      "Provide loyalty points incentive",
      "Improve delivery turnaround time",
      "Trigger engagement email automation",
    ],
  },
  Low: {
    color: "bg-green-100 text-green-600",
    icon: <CheckCircle className="text-green-500" size={24} />,
    actions: [
      "Maintain current engagement strategy",
      "Upsell premium features",
      "Encourage referrals and reviews",
    ],
  },
};

export default function Recommendations({ riskLevel = "Medium" }) {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.Medium;

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recommended Actions</h3>

        <span
          className={`px-3 py-1 text-sm rounded-full font-semibold ${config.color}`}
        >
          {riskLevel} Risk
        </span>
      </div>

      <div className="space-y-4">
        {config.actions.map((rec, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 hover:shadow transition duration-300"
          >
            {config.icon}
            <p className="text-gray-700">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
