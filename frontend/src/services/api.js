import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// ---------- PREDICTION ----------
export const predictChurn = async (payload) => {
  const res = await API.post("/predict/churn", payload);
  return res.data;
};

export const predictBatch = async (payload) => {
  const res = await API.post("/predict/batch", payload);
  return res.data;
};

// ---------- DASHBOARD ----------
export const getStats = async () => {
  const res = await API.get("/stats");
  return res.data;
};

// ---------- CHURN ----------
export const getChurnDistribution = async () => {
  const res = await API.get("/churn/distribution");
  return res.data;
};

export const getChurnSegments = async () => {
  const res = await API.get("/churn/segments");
  return res.data;
};

export const getHighRiskCustomers = async () => {
  const res = await API.get("/churn/high-risk");
  return res.data;
};

export const getGeographicChurn = async () => {
  const res = await API.get("/churn/geography");
  return res.data;
};

export const getChurnTrend = async () => {
  const res = await API.get("/churn/trend");
  return res.data;
};

// ---------- SENTIMENT ----------
export const getSentimentSummary = async () => {
  const res = await API.get("/sentiment/summary");

  return {
    totalFeedback: 10000, 
    positive: res.data.positive_pct,
    neutral: res.data.neutral_pct,
    negative: res.data.negative_pct,
  };
};

export const getSentimentTrend = async () => {
  const res = await API.get("/sentiment/trends");
  return res.data;
};

export const getSentimentChannels = async () => {
  const res = await API.get("/sentiment/channels");
  return res.data;
};

export const getWordFrequency = async () => {
  const res = await API.get("/sentiment/words");
  return res.data;
};

export default API;

// ---------- CUSTOMERS ----------
export const getCustomers = async () => {
  const res = await API.get("/customers");
  return res.data;
};

// ---------- SETTINGS ----------
export const getSettings = async () => {
  const res = await API.get("/settings");
  return res.data;
};

export const saveSettings = async (payload) => {
  const res = await API.post("/settings", payload);
  return res.data;
};

