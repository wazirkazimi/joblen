import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Page imports
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminGenerations from "./pages/admin/AdminGenerations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />

      {/* Admin Auth Route */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Panel Secured Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="templates" element={<AdminTemplates />} />
        <Route path="generations" element={<AdminGenerations />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
