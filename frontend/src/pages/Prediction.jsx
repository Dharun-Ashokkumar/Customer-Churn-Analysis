import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function Prediction() {

  const [formData, setFormData] = useState({
    avg_order_value: "",
    avg_delivery_time: "",
    avg_rating: "",
    discount_rate: "",
    value_per_minute: "",
    rating_discount_interaction: "",
    avg_sentiment: "",
    neg_review_ratio: ""
  });

  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRowIndex, setNewRowIndex] = useState(null);

  /* HANDLE INPUT CHANGE */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value)
    });
  };

  /* FETCH HISTORY */
  const fetchHistory = async () => {
    try {

      const res = await axios.get(
        `${API_BASE}/predictions/history`
      );

      setHistory(res.data);

      // highlight newest row
      setNewRowIndex(0);

      setTimeout(() => {
        setNewRowIndex(null);
      }, 3000);

    } catch (err) {
      console.error(err);
    }
  };

  /* LOAD HISTORY ON PAGE LOAD */
 useEffect(() => {

  const loadData = async () => {

    try {

      const [
        statsRes,
        distRes,
        segmentRes,
        trendRes,
        geoRes
      ] = await Promise.all([
        getStats(),
        getChurnDistribution(),
        getChurnSegments(),
        getChurnTrend(),
        getGeographicChurn(),
      ]);

      setStats(statsRes || {});
      setRiskDist(distRes || []);
      setSegments(segmentRes || []);
      setTrend(trendRes || []);
      setGeo(geoRes || []);

    } catch (error) {
      console.error("Dashboard loading error:", error);
    }

  };

  loadData();

  const interval = setInterval(loadData, 8000); // auto refresh every 8s

  return () => clearInterval(interval);

}, []);

  /* SUBMIT PREDICTION */
  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/predict/churn`,
        formData
      );

      setResult(res.data);

      // refresh history immediately
      await fetchHistory();

    } catch (err) {

      console.error(err);
      alert("Prediction failed");

    } finally {

      setLoading(false);

    }
  };

  /* COLOR BASED RISK */
  const riskColor = (risk) => {
    if (risk === "High") return "text-red-500";
    if (risk === "Medium") return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-8">

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-gray-800">
        Food Churn Prediction
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >

        <input
          name="avg_order_value"
          placeholder="Average Order Value"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="avg_delivery_time"
          placeholder="Delivery Time"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="avg_rating"
          placeholder="Average Rating"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="discount_rate"
          placeholder="Discount Rate"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="value_per_minute"
          placeholder="Value Per Minute"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="rating_discount_interaction"
          placeholder="Rating Discount Interaction"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="avg_sentiment"
          placeholder="Sentiment Score"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        <input
          name="neg_review_ratio"
          placeholder="Negative Review Ratio"
          onChange={handleChange}
          className="bg-slate-900 text-white p-4 rounded-xl"
        />

        {/* BUTTON WITH SPINNER */}
        <button
          type="submit"
          className="col-span-2 bg-green-500 hover:bg-green-600 text-black font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
        >

          {loading && (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          )}

          {loading ? "Predicting..." : "Predict Churn"}

        </button>

      </form>

      {/* RESULT CARD */}
      {result && (

        <motion.div
          className="bg-white rounded-xl p-6 shadow-lg space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >

          <h2 className="text-xl font-semibold">
            Prediction Result
          </h2>

          <p>Cluster ID: {result.cluster_id}</p>

          <p>
            Churn Probability: {result.churn_probability}
          </p>

          {/* PROGRESS BAR */}
          <div>

            <div className="w-full bg-gray-200 rounded-full h-3">

              <div
                className="bg-green-500 h-3 rounded-full"
                style={{
                  width: `${result.churn_probability * 100}%`
                }}
              ></div>

            </div>

          </div>

          {/* RISK LEVEL */}
          <p className={`font-semibold ${riskColor(result.risk_level)}`}>
            Risk Level: {result.risk_level}
          </p>

        </motion.div>

      )}

      {/* HISTORY TABLE */}
      {history.length > 0 && (

        <div className="bg-white rounded-xl p-6 shadow-lg">

          <h2 className="text-xl font-semibold mb-4">
            Recent Predictions
          </h2>

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b text-left">
                <th>Order Value</th>
                <th>Rating</th>
                <th>Probability</th>
                <th>Risk</th>
              </tr>

            </thead>

            <tbody>

              {history.map((row, index) => (

                <tr
                  key={index}
                  className={`border-b transition ${
                    index === newRowIndex ? "bg-green-100" : ""
                  }`}
                >

                  <td>{row.avg_order_value}</td>
                  <td>{row.avg_rating}</td>
                  <td>{row.churn_probability}</td>
                  <td className={riskColor(row.risk_level)}>
                    {row.risk_level}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}