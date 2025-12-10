// src/pages/Home.jsx
import React from "react";
import Header from "../../components/Header/Header.jsx";
import Footer from "../../components/Footer/Footer.jsx";
import AppContent from "../../pages/AppContent/AppContent.jsx"; // este será el contenido que moviste

const Home = () => {
  return (
    <>
      <Header />
      <AppContent />
      <Footer />
    </>
  );
};

export default Home;
