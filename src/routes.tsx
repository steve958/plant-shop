// src/router.tsx
import { createHashRouter } from "react-router-dom";
import App from "./App";
import Cart from "./components/Cart/Cart";
import LogIn from "./components/LogIn/LogIn";
import Home from "./components/Home/Home";
import Register from "./components/Register/Register";
import ProfilePage from "./components/UserProfile/ProfilePage";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import Order from "./components/Order/Order";
import Confirmation from "./components/Confirmation/Confirmation";
import SubCategoryPage from "./components/SubCategory/SubCategory";

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/početna",
        element: <Home />,
      },
      {
        path: "/korpa",
        element: <Cart />,
      },
      {
        path: "/prijava",
        element: <LogIn />,
      },
      {
        path: "/registracija",
        element: <Register />,
      },
      {
        path: "/potvrda",
        element: <Confirmation />,
      },
      {
        path: "/profil",
        element: (
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        ),
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
        path: "/podkategorija/:subCategory",
        element: <SubCategoryPage />,
      },
    ],
  },
]);
