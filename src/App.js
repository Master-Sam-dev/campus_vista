import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";   // your UI landing page
import ThreeDViewer from "./ThreeDViewer"; // the file you already have

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/viewer" element={<ThreeDViewer />} />
      </Routes>
    </Router>
  );
}

export default App;
