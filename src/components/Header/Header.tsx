import "./Header.css";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../Redux/store";
import { setSearchQuery } from '../Redux/searchSlice'; // Import the action
import LogoX from "../../assets/Logo-500.jpg";
import originalWebsite from '../../assets/loader.svg'

export default function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.isAdmin;

  // Get cart items and calculate total items
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = cartItems.length; // Calculate total items

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value)); // Dispatch the search query to Redux
  };

  const handleNavigate = () => {
    window.location.href = 'https://www.plantcentar.com/pocetna'
  }

  return (
    <div className="header-container">
      <div className="logo-container" onClick={() => navigate("/početna")}>
        <img src={LogoX} alt="Logo" className="logo-picture" />
        {/* <h1>shop</h1> */}
      </div>
      <div className="search-container">
        <input
          className="search-input"
          type="text"
          placeholder="Pretražite ovde"
          onChange={handleSearchChange} // Add onChange to capture input
        />
        <div className="search-icon-container">
          <SearchOutlinedIcon sx={{ fontSize: 30 }} />
        </div>
      </div>
      <div className="header-menu-container">
        <div className="login-container" onClick={handleNavigate}>
          <img src={originalWebsite} className="info-site-image" alt="originalni website" />
          <label className="header-menu-label">Plant centar</label>
        </div>
        {user && <div className="cart-header-container" onClick={() => navigate("/korpa")}>
          <ShoppingCartOutlinedIcon sx={{ fontSize: 40, color: '#54C143', cursor: 'pointer' }} />
          {totalItems > 0 && ( // Only show the quantity if there are items
            <span className="cart-quantity">{totalItems}</span>
          )}
          <label className="header-menu-label">Korpa</label>
        </div>}
        <div className="login-container" onClick={() => navigate(user ? "/profil" : "/prijava")}>
          <AccountCircleOutlinedIcon sx={{ fontSize: 40, color: '#54C143' }} />
          <label className="header-menu-label">{user ? "Profil" : "Prijava"}</label>
        </div>
        {isAdmin && (
          <div className="admin-icon-container" onClick={() => navigate("/admin/panel")}>
            <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 40, color: '#54C143' }} />
            <label className="header-menu-label">Admin</label>
          </div>
        )}
      </div>
    </div>
  );
}
