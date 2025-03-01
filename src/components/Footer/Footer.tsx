import './Footer.css';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Kontakt</h3>
          <p>Email: plant.centar@gmail.com</p>
          <p>Telefon: +381 60 4055510</p>
        </div>
        <div className="footer-section">
          <h3>Pratite nas</h3>
          <span>
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
          </span>
        </div>
        <div className="footer-section">
          <h3>Adresa</h3>
          <p>Vojvode Janka Stojićevića 22, Šabac</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 SN. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
