import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSentimentSummary,
  getSentimentTrend,
  getSentimentChannels,
  getWordFrequency,
} from "../services/api";

import SentimentKPIs from "../components/sentiment/SentimentKPIs";
import SentimentTrend from "../components/sentiment/SentimentTrend";
import ChannelDonuts from "../components/sentiment/ChannelDonuts";
import TopThemes from "../components/sentiment/TopThemes";
import WordFrequency from "../components/sentiment/WordFrequency";

export default function Analytics() {
  const navigate = useNavigate();

  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [channels, setChannels] = useState([]);
  const [words, setWords] = useState([]);

  useEffect(() => {
    getSentimentSummary().then(setKpis);
    getSentimentTrend().then(setTrend);
    getSentimentChannels().then(setChannels);
    getWordFrequency().then(setWords);
  }, []);

  // 🔒 Prevent render until data is ready
  if (!kpis) return null;

  return (
    <div className="space-y-10">
      {/* ✅ TOP BUTTONS */}
      <div className="flex gap-3">
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Analytics
        </button>

        <button
          onClick={() => navigate("/sentiment")}
          className="bg-white border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100"
        >
          Sentiment Analysis
        </button>
      </div>

      {/* KPI Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SentimentKPIs data={kpis} />
      </motion.div>

      {/* Trend + Channel Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <SentimentTrend data={trend} />
        <ChannelDonuts data={channels} />
      </div>

      {/* Themes + Word Frequency */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <TopThemes />
        <WordFrequency data={words} />
      </div>
    </div>
  );
}
