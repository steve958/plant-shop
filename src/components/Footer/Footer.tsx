import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import PlantCentarLogo from "../../assets/plant-centar-logo-horizontalni.svg";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="shop-footer">
      <div className="shop-footer__shell">
        <div className="shop-footer__cta">
          <div>
            <span>Niste sigurni koji proizvod vam treba?</span>
            <strong>Naš tim će vam pomoći da napravite pravi izbor.</strong>
          </div>
          <a href="https://www.plantcentar.com/kontakt">
            Kontaktirajte nas
            <ArrowForwardIcon aria-hidden="true" />
          </a>
        </div>

        <div className="shop-footer__grid">
          <div className="shop-footer__brand">
            <Link to="/početna" aria-label="Plant Centar prodavnica – početna">
              <img src={PlantCentarLogo} alt="Plant Centar prodavnica" />
            </Link>
            <p>
              Stručan izbor proizvoda za poljoprivredu, baštu i domaćinstvo.
            </p>
          </div>

          <div className="shop-footer__column">
            <h3>Prodavnica</h3>
            <Link to="/početna">Akcija</Link>
            <Link to="/podkategorija/Insekticidi">Zaštita bilja</Link>
            <Link to="/podkategorija/Kristalna vodootopiva đubriva">Ishrana bilja</Link>
            <Link to="/podkategorija/Mašine">Garden program</Link>
          </div>

          <div className="shop-footer__column">
            <h3>Kontakt</h3>
            <a href="mailto:plant.centar@gmail.com">plant.centar@gmail.com</a>
            <a href="tel:+381604055510">+381 60 405 5510</a>
            <p>Vojvode Janka Stojićevića 22<br />Šabac</p>
          </div>

          <div className="shop-footer__column">
            <h3>Pratite nas</h3>
            <div className="shop-footer__socials">
              <a
                href="https://www.facebook.com/people/Plant-centar/61556143327941/?mibextid=ZbWKwL"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/plant_centar/?utm_source=qr&igsh=MWRhZzM5Yzl3ZTlnaQ%3D%3D"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="shop-footer__bottom">
          <span>© {new Date().getFullYear()} Plant Centar. Sva prava zadržana.</span>
          <a href="https://www.plantcentar.com/pocetna">Plant Centar sajt</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
