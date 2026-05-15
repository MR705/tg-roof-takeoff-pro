import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import Upload from "./screens/Upload";
import Scale from "./screens/Scale";
import Trace from "./screens/Trace";
import Estimate from "./screens/Estimate";
import ProjectList from "./screens/ProjectList";
import AdminDashboard from "./screens/AdminDashboard";
import NotificationCenter from "./components/NotificationCenter";

export default function App() {
  return (
    <BrowserRouter>
      <NotificationCenter />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/scale" element={<Scale />} />
        <Route path="/trace" element={<Trace />} />
        <Route path="/estimate" element={<Estimate />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
