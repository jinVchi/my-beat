import { Routes, Route } from "react-router-dom";
import HomePage from "@/routes/home";
import LoginPage from "@/routes/login";
import SelectRegionPage from "@/routes/select-region";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-region" element={<SelectRegionPage />} />
    </Routes>
  );
}
