import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layout/DashboardLayout";

import Analytics from "./pages/Analytics";
import CustomerRiskDashboard from "./pages/CustomerRiskDashboard";
import Settings from "./pages/Settings";

// ✅ Location Risk Page
import LocationRiskDashboard from "./pages/LocationRiskDashboard";

// ✅ Sentiment Analysis Page
import SentimentAnalysis from "./pages/SentimentAnalysis";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* ✅ Default landing page */}
          <Route index element={<LocationRiskDashboard />} />

          {/* Pages */}
          <Route path="analytics" element={<Analytics />} />
          <Route path="sentiment" element={<SentimentAnalysis />} />

          {/* ✅ Customers route -> CustomerRiskDashboard */}
          <Route path="customers" element={<CustomerRiskDashboard />} />

          <Route path="settings" element={<Settings />} />

          {/* Optional direct route */}
          <Route path="location-risk" element={<LocationRiskDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
