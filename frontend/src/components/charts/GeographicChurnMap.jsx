import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getGeographicChurn } from "../../services/api";

export default function GeographicChurnMap() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    getGeographicChurn().then((res = []) => {
      const cleaned = res
        .filter(
          (d) =>
            typeof d.lat === "number" &&
            typeof d.lng === "number" &&
            !Number.isNaN(d.lat) &&
            !Number.isNaN(d.lng)
        )
        // ✅ sort by risk
        .sort((a, b) => (b.churn_probability || 0) - (a.churn_probability || 0))
        // ✅ limit points (better performance)
        .slice(0, 200)
        .map((d, idx) => ({
          id: d.customer_id ?? idx,
          lat: Number(d.lat),
          lng: Number(d.lng),
          risk: Number(d.churn_probability) || 0,
          level: d.risk_level || "Low",
        }));

      setPoints(cleaned);
    });
  }, []);

  // ✅ color logic
  const getColor = (risk) => {
    if (risk >= 0.7) return "#ef4444"; // High
    if (risk >= 0.6) return "#f59e0b"; // Medium
    return "#22c55e"; // Low
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-gray-700 font-semibold mb-4">
        Geographic Churn Map (Global)
      </h3>

      <div className="h-[500px] rounded-lg overflow-hidden border">
        <MapContainer
          center={[20, 0]}   // ✅ world center
          zoom={2}           // ✅ zoom fixed (global view)
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          {/* ✅ Base Map */}
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ✅ Markers */}
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={4}   // slightly smaller
              pathOptions={{
                color: getColor(p.risk),
                fillColor: getColor(p.risk),
                fillOpacity: 0.7,  // ✅ better look
                weight: 0.5,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">
                    Customer {p.id}
                  </div>
                  <div>Risk: {Math.round(p.risk * 100)}%</div>
                  <div>Level: {p.level}</div>
                  <div>
                    Lat: {p.lat.toFixed(2)}, Lng: {p.lng.toFixed(2)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* ✅ Legend */}
      <div className="flex gap-4 text-xs mt-3 text-gray-600">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          High Risk
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          Medium Risk
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Low Risk
        </span>
      </div>
    </div>
  );
}