import RouteScroll from "./components/RouteScroll";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "./components/NavBar/NavBar";
import Loader from "./components/Loader/Loader";

function App() {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.hash}`;
  // Derived during render so the overlay is already up in the first frame of a
  // new route; setting it from an effect let the page paint once uncovered.
  const [readyRouteKey, setReadyRouteKey] = useState<string | null>(null);
  const routeLoading = readyRouteKey !== routeKey;

  useEffect(() => {
    let frame = 0;
    // Keep covering the page until catalogues have loaded and RouteScroll has
    // moved to its target, so the top of the page never flashes before a jump.
    const reveal = () => {
      if (document.querySelector('[data-product-catalogue][aria-busy="true"]')) {
        frame = window.requestAnimationFrame(reveal);
        return;
      }
      frame = window.requestAnimationFrame(() => setReadyRouteKey(routeKey));
    };
    const timer = window.setTimeout(reveal, 500);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [routeKey]);

  return (
    <div className="container-fluid">
      <RouteScroll />
      <Header />
      <NavBar />
      <div className="shop-route-stage" aria-busy={routeLoading}>
        <Outlet />
        {routeLoading && <Loader overlay label="Učitavamo stranicu" />}
      </div>
      <Footer />
      <ToastContainer
        position="top-center"
        autoClose={1500} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ marginTop: "100px" }} 
        limit={1}
      />
    </div>
  );
}

export default App;
