import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { getGeographicChurn } from "../../services/api";

// 🌍 World map (we zoom into India)
const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GeographicChurnMap() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    getGeographicChurn().then((res) => {
      const data = res || [];

      const cleaned = data
        .filter(
          (d) =>
            typeof d.lat === "number" &&
            typeof d.lng === "number" &&
            !Number.isNaN(d.lat) &&
            !Number.isNaN(d.lng)
        )
        .map((d, idx) => ({
          id: d.customer_id ?? idx,
          coordinates: [d.lng, d.lat],
          risk: Number(d.churn_probability) || 0,
        }));

      setPoints(cleaned);
    });
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-4">
        Geographic Customer Churn Map
      </h3>

      {/* 🔥 LARGE MAP CONTAINER */}
      <div className="w-full h-[500px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [20, 20],
          }}
          width={800}
          height={500}
          style={{ width: "100%", height: "100%" }}
        >
          {/* MAP LAYER */}
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e5e7eb"
                  stroke="#ffffff"
                  strokeWidth={0.5}
                />
              ))
            }
          </Geographies>

          {/* MARKERS */}
          {points.map((p) => (
            <Marker key={p.id} coordinates={p.coordinates}>
              <circle
                r={2.5} // Size of the marker
                fill={
                  p.risk > 0.6
                    ? "#ef4444"
                    : p.risk > 0.3
                    ? "#f59e0b"
                    : "#22c55e"
                }
                stroke="#ffffff"
                strokeWidth={0.8}
              />
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </div>
  );
}
