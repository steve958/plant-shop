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
  const [routeLoading, setRouteLoading] = useState(true);

  useEffect(() => {
    setRouteLoading(true);
    const timer = window.setTimeout(() => setRouteLoading(false), 500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [location.hash, location.pathname]);

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
