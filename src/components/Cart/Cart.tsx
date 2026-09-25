import { cartKey } from '../../data/productOptions';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../Redux/store';
import { decreaseQuantity, increaseQuantity, removeFromCart } from '../Redux/cartSlice';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import productPlaceholder from '../../assets/product-placeholder.svg';
import './Cart.css';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  // Delivery cost depends on the packages ordered and is confirmed by the team.
  const finalTotal = subtotal;
  const formatPrice = (price: number) => new Intl.NumberFormat('sr-RS', {
    style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);

  const handleOrder = () => {
    navigate('/poručivanje', { state: { total: finalTotal } });
  };

  if (!cartItems.length) {
    return (
      <main className="cart-container cart-empty">
        <span className="cart-eyebrow">Vaša korpa</span>
        <div className="cart-empty-icon" aria-hidden="true">0</div>
        <h1>Korpa je trenutno prazna</h1>
        <p>Istražite naš asortiman i dodajte proizvode koji su vam potrebni.</p>
        <button className="cart-primary-button" onClick={() => navigate('/početna')}>Pogledaj proizvode</button>
      </main>
    );
  }

  return (
    <main className="cart-container">
      <header className="cart-heading">
        <div><span className="cart-eyebrow">Pregled kupovine</span><h1>Vaša korpa</h1></div>
        <p>{cartItems.length} {cartItems.length === 1 ? 'proizvod' : 'proizvoda'} u korpi</p>
      </header>

      <div className="cart-login-notice"><div><strong>Kupujete bez registracije.</strong><span>U sledećem koraku unesite samo kontakt i adresu za ovu porudžbinu.</span></div></div>

      <div className="cart-layout">
        <section className="cart-items-wrapper" aria-label="Proizvodi u korpi">
          {cartItems.map((item) => (
            <article key={cartKey(item)} className="cart-item">
              <div className="cart-image-wrap"><img src={item.image || productPlaceholder} alt={item.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} /></div>
              <div className="cart-item-details">
                <span className="cart-item-label">Proizvod</span>
                <h2>{item.name}</h2>
                <p className="cart-unit-price">{formatPrice(item.price)} / kom</p>
                <div className="cart-item-actions">
                  <div className="cart-quantity" aria-label={`Količina za ${item.name}`}>
                    <button aria-label="Smanji količinu" onClick={() => dispatch(decreaseQuantity(cartKey(item)))}>−</button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button aria-label="Povećaj količinu" onClick={() => dispatch(increaseQuantity(cartKey(item)))}>+</button>
                  </div>
                  <button className="cart-remove" onClick={() => dispatch(removeFromCart(cartKey(item)))}><DeleteOutlineIcon fontSize="small" /> Ukloni</button>
                </div>
              </div>
              <strong className="cart-line-price">{formatPrice(item.price * item.quantity)}</strong>
            </article>
          ))}
          <button className="cart-continue" onClick={() => navigate('/početna')}>← Nastavi kupovinu</button>
        </section>

        <aside className="cart-summary">
          <span className="cart-eyebrow">Sažetak</span><h2>Pregled porudžbine</h2>
          <dl><div><dt>Vrednost proizvoda</dt><dd>{formatPrice(subtotal)}</dd></div><div><dt>Dostava</dt><dd>Po dogovoru</dd></div></dl>
          <div className="cart-total"><span>Ukupno bez dostave</span><strong>{formatPrice(finalTotal)}</strong><small>PDV je uračunat u cenu · cena dostave zavisi od pakovanja i potvrđuje se pri dogovoru</small></div>
          <button className="cart-primary-button" onClick={handleOrder}>Unesite podatke za dostavu</button>
          <div className="cart-delivery"><LocalShippingOutlinedIcon /><span><strong>Dostava širom Srbije</strong>Cenu dostave, rok i dostupnost potvrđuje naš tim.</span></div>
        </aside>
      </div>
    </main>
  );
}
