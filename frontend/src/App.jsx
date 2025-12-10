// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // ✅ FIX AQUÍ

import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";
import ResetPass from "./pages/ResetPass/ResetPass.jsx";
import FirmDetail from "./pages/FirmDetail/FirmDetail.jsx";

import HowWork from "./pages/HowWork/HowWork.jsx";
import Contact from "./pages/Contact/Contact.jsx";
import AboutTool from "./pages/AboutTool/AboutTool.jsx";
import Politics from "./pages/Politics/Politics.jsx";
import Terms from "./pages/Terms/Terms.jsx";
import AboutUs from "./pages/AboutUs/AboutUs.jsx";
import GlobalConnectionForm from "./pages/Form/GlobalConnectionForm.jsx";
import LocalConnectionForm from "./pages/Form/LocalConnectionForm.jsx";
import FeeBenchmarkingForm from "./pages/Form/FeeBenchmarkingForm.jsx";

import Forms from "./pages/Forms/Forms.jsx";
import Home from "./pages/Home/Home.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPass />} />

        <Route path="/how-it-works" element={<HowWork />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about-tool" element={<AboutTool />} />
        <Route path="/privacy-policy" element={<Politics />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/form-global-connection" element={<GlobalConnectionForm />} />
        <Route path="/form-local-connection" element={<LocalConnectionForm />} />
        <Route path="/form-fee-benchmarking" element={<FeeBenchmarkingForm />} />
        <Route path="/forms" element={<Forms />} />

        {/* 🔥 Ruta del detalle */}
        <Route path="/firm/:id" element={<FirmDetail />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
