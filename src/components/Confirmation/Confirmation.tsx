import { useNavigate } from 'react-router-dom';
import "./Confirmation.css"
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

const Confirmation = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/početna'); 
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-wrapper">
      <CheckCircleOutlinedIcon className="checked" sx={{fontSize: 350}} />
      <h2>Vaša porudžbina je poslata!</h2>
      <p>Hvala na kupovini!</p>
      
      </div>
      <button className="confirmation-home-button" onClick={handleGoHome}>Početna </button>
    </div>
  );
};

export default Confirmation;
