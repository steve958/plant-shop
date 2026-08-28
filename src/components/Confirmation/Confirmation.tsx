import { useLocation, useNavigate } from 'react-router-dom';
import "./Confirmation.css"
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

const Confirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderNumber = (location.state as { orderNumber?: string } | null)?.orderNumber;

  const handleGoHome = () => {
    navigate('/početna'); 
  };

  return (
    <main className="confirmation-container">
      <div className="confirmation-wrapper">
        <div className="confirmation-icon"><CheckCircleOutlinedIcon className="checked" /></div>
        <span>Porudžbina je primljena</span>
        <h1>Hvala na poverenju.</h1>
        <p>Naš tim će proveriti dostupnost proizvoda i kontaktirati vas radi potvrde dostave.</p>
        {orderNumber && <div className="confirmation-number"><span>Broj porudžbine</span><strong>{orderNumber}</strong></div>}
        <div className="confirmation-note"><strong>Šta sledi?</strong><span>Potvrda porudžbine i dogovor oko isporuke stižu putem telefona ili emaila.</span></div>
        <button className="confirmation-home-button" onClick={handleGoHome}>Nazad na početnu</button>
      </div>
    </main>
  );
};

export default Confirmation;
