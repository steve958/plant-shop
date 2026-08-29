import "./Header.css";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../Redux/store";
import { setSearchQuery } from "../Redux/searchSlice";
import PlantCentarLogo from "../../assets/plant-centar-logo-horizontalni.svg";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value));
  };

  const handleSearchFocus = () => {
    const catalogue = document.querySelector<HTMLElement>("[data-product-catalogue]");
    if (catalogue) {
      catalogue.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (location.pathname !== "/početna") navigate("/početna#akcija");
  };

  return (
    <header className="shop-header">
      <div className="shop-header__utility">
        <div className="shop-header__shell shop-header__utility-inner">
          <span className="shop-header__delivery">
            <LocalShippingOutlinedIcon aria-hidden="true" />
            Dostava širom Srbije
          </span>
          <a href="https://www.plantcentar.com/pocetna">
            Saveti i informacije na Plant Centar sajtu
            <ArrowOutwardIcon aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="shop-header__main">
        <div className="shop-header__shell shop-header__main-inner">
          <button
            className="shop-header__logo"
            type="button"
            onClick={() => navigate("/početna")}
            aria-label="Plant Centar prodavnica – početna"
          >
            <img src={PlantCentarLogo} alt="Plant Centar" />
            <span className="shop-header__shop-label">Prodavnica</span>
          </button>

          <label className="shop-search">
            <span className="shop-search__label">Pretraga proizvoda</span>
            <input
              type="search"
              placeholder="Pretražite proizvode, brendove i namenu..."
              onFocus={handleSearchFocus}
              onChange={handleSearchChange}
            />
            <SearchOutlinedIcon className="shop-search__icon" aria-hidden="true" />
          </label>

          <div className="shop-header__actions">
            <button
              className="shop-action shop-action--cart"
              type="button"
              onClick={() => navigate("/korpa")}
            >
              <ShoppingBagOutlinedIcon aria-hidden="true" />
              {totalItems > 0 && <strong>{totalItems}</strong>}
              <span>
                <small>Kupovina</small>
                Korpa
              </span>
            </button>

            {user?.isAdmin && (
              <button
                className="shop-action shop-action--admin"
                type="button"
                onClick={() => navigate("/admin/panel")}
              >
                <AdminPanelSettingsOutlinedIcon aria-hidden="true" />
                <span>
                  <small>Upravljanje</small>
                  Admin
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
