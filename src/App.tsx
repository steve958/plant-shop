import { Outlet, useNavigate } from "react-router-dom";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "./components/NavBar/NavBar";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/početna");
  }, []);

  return (
    <div className="container-fluid">
      <Header />
      <NavBar />
      <Outlet />
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
