// src/components/PrivateRoute/PrivateRoute.tsx
import { ReactNode, FC } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/store'; // Putanja do store.ts

interface PrivateRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute: FC<PrivateRouteProps> = ({ children, adminOnly }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();
  const isAdmin = user?.isAdmin || false; // Pretpostavka da `isAdmin` postoji u `user` objektu
  const isReadOnlyAdminPreview =
    import.meta.env.DEV &&
    adminOnly &&
    new URLSearchParams(location.search).get('preview') === 'admin';
  if (isReadOnlyAdminPreview) {
    return <>{children}</>;
  }

  if (!user) {
    // Ako korisnik nije prijavljen, preusmeri na login
    return <Navigate to="/admin/prijava" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Ako je ruta za admin, ali korisnik nije admin, preusmeri na početnu
    return <Navigate to="/admin/prijava" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
