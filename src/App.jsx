import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ThreeDViewer from "./components/ThreeDViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/viewer" element={<ThreeDViewer modelUrl="/input.glb" />} />
      </Routes>
    </Router>
  );
}

export default App;
