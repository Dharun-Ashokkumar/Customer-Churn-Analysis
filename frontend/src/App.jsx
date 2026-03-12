import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./layout/DashboardLayout";
import Login from "./pages/Login";

import Analytics from "./pages/Analytics";
import CustomerRiskDashboard from "./pages/CustomerRiskDashboard";
import Settings from "./pages/Settings";
import LocationRiskDashboard from "./pages/LocationRiskDashboard";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import Prediction from "./pages/Prediction";

function App() {

  const isAuth = localStorage.getItem("auth");

  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN PAGE */}
        <Route path="/login" element={<Login />} />

        {/* PROTECTED DASHBOARD */}
        <Route
          path="/"
          element={isAuth ? <DashboardLayout /> : <Navigate to="/login" />}
        >

          {/* Default page */}
          <Route index element={<LocationRiskDashboard />} />

          {/* Pages */}
          <Route path="analytics" element={<Analytics />} />
          <Route path="sentiment" element={<SentimentAnalysis />} />
          <Route path="customers" element={<CustomerRiskDashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="location-risk" element={<LocationRiskDashboard />} />
          <Route path="predict" element={<Prediction />} />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;