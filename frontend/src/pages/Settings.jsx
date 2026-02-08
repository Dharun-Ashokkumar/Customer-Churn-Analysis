import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "../services/api";

export default function Settings() {
  const [lowRisk, setLowRisk] = useState(0.3);
  const [highRisk, setHighRisk] = useState(0.6);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔹 Load settings from backend
  useEffect(() => {
    getSettings().then((s) => {
      setLowRisk(s.lowRisk);
      setHighRisk(s.highRisk);
      setEmailAlerts(s.emailAlerts);
      setWeeklyReport(s.weeklyReport);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    await saveSettings({
      lowRisk,
      highRisk,
      emailAlerts,
      weeklyReport,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-gray-500 text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-black">
          Settings
        </h2>
        <p className="text-gray-600">
          Configure churn thresholds and notification preferences.
        </p>
      </div>

      {/* RISK THRESHOLDS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-lg font-semibold">
          Churn Risk Thresholds
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">
              Low → Medium Threshold
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={lowRisk}
              onChange={(e) => setLowRisk(Number(e.target.value))}
              className="w-full mt-2 px-4 py-2 rounded-lg border"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">
              Medium → High Threshold
            </label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={highRisk}
              onChange={(e) => setHighRisk(Number(e.target.value))}
              className="w-full mt-2 px-4 py-2 rounded-lg border"
            />
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="text-lg font-semibold">Notifications</h3>

        <div className="flex items-center justify-between">
          <span>Email alerts for high-risk customers</span>
          <input
            type="checkbox"
            checked={emailAlerts}
            onChange={() => setEmailAlerts(!emailAlerts)}
            className="h-5 w-5"
          />
        </div>

        <div className="flex items-center justify-between">
          <span>Weekly churn summary report</span>
          <input
            type="checkbox"
            checked={weeklyReport}
            onChange={() => setWeeklyReport(!weeklyReport)}
            className="h-5 w-5"
          />
        </div>
      </div>

      {/* SYSTEM INFO */}
      <div className="bg-white p-6 rounded-xl shadow space-y-2 text-sm text-gray-600">
        <h3 className="text-lg font-semibold text-black">
          System Info
        </h3>
        <p><strong>Mode:</strong> Demo</p>
        <p><strong>Backend:</strong> FastAPI</p>
        <p><strong>Model:</strong> XGBoost (Churn)</p>
      </div>

      {/* SAVE */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 px-6 py-2 rounded-lg text-white hover:bg-blue-700 transition"
        >
          Save Settings
        </button>

        {saved && (
          <span className="text-green-600 text-sm font-medium">
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
