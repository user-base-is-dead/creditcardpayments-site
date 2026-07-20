import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import CalculatorPage from './pages/CalculatorPage/CalculatorPage';
import MoneyTransfer from './pages/MoneyTransfer/MoneyTransfer';
import Contact from './pages/Contact/Contact';
import Login from './pages/Login/Login';
import Docs from './pages/Docs/Docs';
import Admin from './pages/Admin/Admin';
import Profile from './pages/Profile/Profile';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const location = useLocation();
  const lenisRef = useRef(null);
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Force the page to start at the top on reload/refresh (ported from
  // rising_sun_fitness). Disabling browser scroll restoration keeps Lenis and
  // ScrollTrigger positions predictable.
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Lenis config ported from rising_sun_fitness, translated to the current
    // lenis@1.3 API (direction -> orientation, gestureDirection ->
    // gestureOrientation, mouseMultiplier -> wheelMultiplier,
    // smoothTouch:false -> syncTouch:false).
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: false,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;
    // Expose for in-page anchor scrolling (e.g. the Docs sidebar).
    window.lenis = lenis;

    // Force Lenis itself to the top before it takes over.
    lenis.scrollTo(0, { immediate: true });

    // Keep ScrollTrigger in sync with Lenis' virtual scroll.
    lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker (single RAF loop for both).
    const tickHandler = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickHandler);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger once Lenis is ready so all triggers measure correctly.
    const refreshId = setTimeout(() => ScrollTrigger.refresh(), 100);

    return () => {
      clearTimeout(refreshId);
      gsap.ticker.remove(tickHandler);
      lenis.destroy();
      lenisRef.current = null;
      window.lenis = null;
    };
  }, []);

  // On route change: jump to the top *through Lenis*, then re-measure
  // ScrollTriggers. Skip for in-page anchors (e.g. /docs#send-money) — the
  // target page scrolls itself to the correct section.
  useEffect(() => {
    if (location.hash) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    const id = setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => clearTimeout(id);
  }, [location.pathname, location.hash]);

  return (
    <div className="app-shell">
      {/* Header Navigation */}
      {!isAdminRoute && <Navbar />}

      {/* Main Pages */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/money-transfer" element={<MoneyTransfer />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/calculator" element={<CalculatorPage />} />
        </Routes>
      </main>

      {/* Footer Navigation */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}
