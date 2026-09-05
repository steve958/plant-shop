// src/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Cart from "./components/Cart/Cart";
import Home from "./components/Home/Home";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import AdminLogin from "./components/AdminLogin/AdminLogin";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import Order from "./components/Order/Order";
import Confirmation from "./components/Confirmation/Confirmation";
import SubCategoryPage from "./components/SubCategory/SubCategory";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/kategorija/:category", element: <SubCategoryPage /> },
      {
        index: true,
        element: <Navigate to="/početna" replace />,
      },
      {
        path: "/početna",
        element: <Home />,
      },
      {
        path: "/korpa",
        element: <Cart />,
      },
      {
        path: "/potvrda",
        element: <Confirmation />,
      },
      {
        path: "/admin/prijava",
        element: <AdminLogin />,
      },
      {
        path: "/admin/panel",
        element: (
          <PrivateRoute adminOnly>
            <AdminPanel />
          </PrivateRoute>
        ),
      },
      {
        path: "/proizvod/:productId",
        element: <ItemDetails />,
      },
      {
        path: "/poručivanje",
        element: <Order />,
      },
      {
        path: "/prijava",
        element: <Navigate to="/početna" replace />,
      },
      {
        path: "/registracija",
        element: <Navigate to="/početna" replace />,
      },
      {
        path: "/profil",
        element: <Navigate to="/početna" replace />,
      },
      {
        path: "/podkategorija/:subCategory",
        element: <SubCategoryPage />,
      },
    ],
  },
]);
