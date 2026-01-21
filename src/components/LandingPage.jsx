import { useNavigate } from "react-router-dom";
import "../styles.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Navbar */}
      <header className="navbar">
        <h2 className="logo">CampusVista</h2>
        <nav>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#footer">Contact</a></li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Explore <span>CampusVista</span>
          </h1>
          <p>Step into an immersive 3D journey of our digital campus.</p>
          <div className="btn-group">
            <button onClick={() => navigate("/viewer")}>
              Explore 3D Model
            </button>
            <button
              onClick={() =>
                document.getElementById("about").scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Learn More
            </button>
          </div>
        </div>
        <div className="curved-divider"></div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="about-box">
          <h2>About CampusVista</h2>
          <p>
            CampusVista is an interactive 3D model experience that lets you explore a digital campus in real-time.
            Navigate through buildings, discover facilities, and get a virtual tour like never before.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <i className="fas fa-school"></i>
            <h3>Interactive Buildings</h3>
            <p>Walk through detailed models of campus structures.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-route"></i>
            <h3>Navigation</h3>
            <p>Choose your path with real-time WASD + mouse controls.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-vr-cardboard"></i>
            <h3>Immersive Experience</h3>
            <p>Enjoy VR-ready exploration of the digital campus.</p>
          </div>
          <div className="feature-card">
            <i className="fas fa-info-circle"></i>
            <h3>Information Panels</h3>
            <p>Get instant info about each building and facility.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="footer">
        <p>© 2025 CampusVistao</p>
        <div className="socials">
          <a href="#"><i className="fab fa-facebook-f"></i></a>
          <a href="#"><i className="fab fa-twitter"></i></a>
          <a href="#"><i className="fab fa-linkedin-in"></i></a>
          <a href="#"><i className="fab fa-github"></i></a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
