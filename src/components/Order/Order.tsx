import { cartKey, effectivePackagePrice, isOrderable, type PackageOption } from '../../data/productOptions';
import { shopContact } from '../../data/shopContact';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { db } from '../firebase';
import { RootState } from '../Redux/store';
import { clearCart } from '../Redux/cartSlice';
import productPlaceholder from '../../assets/product-placeholder.svg';
import './Order.css';

type GuestOrderData = {
  name: string; surname: string; email: string; phone: string; place: string;
  postalCode: string; street: string; number: string; note: string; privacyAccepted: boolean;
};

const previewCustomer: GuestOrderData = {
  name: 'Marko', surname: 'Petrović', email: 'kupac@primer.rs', phone: '060 123 4567',
  place: 'Šabac', postalCode: '15000', street: 'Primer ulica', number: '22',
  note: 'Pozvati pre isporuke.', privacyAccepted: true,
};

const Order = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const checkoutPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === 'checkout';
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const items = checkoutPreview ? [
    { productId: 'preview-1', name: 'Verimark 10 ml', image: productPlaceholder, price: 1490, quantity: 1 },
    { productId: 'preview-2', name: 'Fertico Aminomax 80', image: productPlaceholder, price: 980, quantity: 2 },
  ] : cartItems;
  const { register, handleSubmit, formState: { errors } } = useForm<GuestOrderData>({
    defaultValues: checkoutPreview ? previewCustomer : { note: '', privacyAccepted: false },
  });
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Delivery cost depends on the packages ordered; the admin confirms it with the customer.
  const delivery = null;
  const total = subtotal;
  const formatPrice = (price: number) => new Intl.NumberFormat('sr-RS', {
    style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);

  const submitOrder = async (data: GuestOrderData) => {
    if (!items.length || submitting || checkoutPreview) return;
    setSubmitting(true);
    const orderNumber = `PC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    try {
      for (const item of items) {
        const snapshot = await getDoc(doc(db, 'products', item.productId));
        const product = snapshot.data();
        const packageId = 'packageId' in item ? item.packageId : '';
        const selected = packageId ? product?.packages?.find((option: PackageOption) => option.id === packageId) as PackageOption | undefined : null;
        const currentPrice = selected ? effectivePackagePrice(selected) : (product?.onDiscount && product.discountPrice ? product.discountPrice : product?.price);
        if (product && !product.archived && !(packageId && !selected) && !isOrderable(selected ? selected.availability : product.availability)) {
          toast.error(`„${item.name}“ trenutno nije na stanju i ne može se poručiti online. Uklonite stavku iz korpe i kontaktirajte nas na ${shopContact.phone} ili ${shopContact.email}.`);
          setSubmitting(false); return;
        }
        if (!product || product.archived || (packageId && !selected) || (!packageId && product.packages?.length) || currentPrice !== item.price) {
          toast.error(`Ponuda za „${item.name}“ je promenjena. Uklonite stavku iz korpe i ponovo izaberite artikal i pakovanje.`);
          setSubmitting(false); return;
        }
      }
      await addDoc(collection(db, 'orders'), {
        orderNumber,
        customer: {
          name: data.name.trim(), surname: data.surname.trim(), email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(), place: data.place.trim(), postalCode: data.postalCode.trim(),
          street: data.street.trim(), number: data.number.trim(),
        },
        items: items.map((item) => ({
          packageId: ('packageId' in item ? item.packageId : '') || '', productId: item.productId, name: item.name, image: item.image || '',
          price: item.price, quantity: item.quantity, lineTotal: item.price * item.quantity,
        })),
        totals: { subtotal, delivery, total },
        customerNote: data.note.trim(),
        status: 'new',
        source: 'web-shop',
        createdAt: serverTimestamp(),
      });
      dispatch(clearCart());
      navigate('/potvrda', { replace: true, state: { orderNumber } });
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Porudžbina trenutno nije sačuvana. Pokušajte ponovo ili nas kontaktirajte.');
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return <main className="order-container order-missing"><span className="order-eyebrow">Poručivanje</span><h1>Korpa je prazna</h1><p>Dodajte proizvode pre unosa podataka za dostavu.</p><button className="order-primary" onClick={() => navigate('/početna')}>Pogledaj proizvode</button></main>;
  }

  return (
    <main className="order-container">
      <header className="order-heading"><span className="order-eyebrow">Kupovina bez registracije</span><h1>Podaci za porudžbinu</h1><p>Unesite kontakt i adresu. Plant Centar će vas pozvati ili kontaktirati emailom radi konačne potvrde.</p></header>
      {checkoutPreview && <div className="order-preview-banner"><strong>Pregled gostujuće kupovine</strong><span>Primer podaci su prikazani lokalno, a čuvanje porudžbine je isključeno.</span></div>}

      <form className="order-layout" onSubmit={handleSubmit(submitOrder)} noValidate>
        <div className="order-form-column">
          <section className="order-customer">
            <div className="order-section-heading"><span>01</span><div><h2>Kontakt podaci</h2><p>Koristimo ih samo za ovu porudžbinu</p></div></div>
            <div className="order-form-grid">
              <OrderField label="Ime" id="order-name" error={errors.name?.message}><input id="order-name" disabled={checkoutPreview || submitting} autoComplete="given-name" {...register('name', { required: 'Unesite ime' })} /></OrderField>
              <OrderField label="Prezime" id="order-surname" error={errors.surname?.message}><input id="order-surname" disabled={checkoutPreview || submitting} autoComplete="family-name" {...register('surname', { required: 'Unesite prezime' })} /></OrderField>
              <OrderField label="Telefon" id="order-phone" error={errors.phone?.message}><input id="order-phone" type="tel" disabled={checkoutPreview || submitting} autoComplete="tel" placeholder="06x xxx xxxx" {...register('phone', { required: 'Unesite broj telefona', minLength: { value: 7, message: 'Proverite broj telefona' } })} /></OrderField>
              <OrderField label="Email" id="order-email" error={errors.email?.message}><input id="order-email" type="email" disabled={checkoutPreview || submitting} autoComplete="email" placeholder="ime@primer.rs" {...register('email', { required: 'Unesite email adresu' })} /></OrderField>
            </div>
          </section>

          <section className="order-customer">
            <div className="order-section-heading"><span>02</span><div><h2>Adresa za dostavu</h2><p>Podaci za slanje porudžbine</p></div></div>
            <div className="order-form-grid order-address-grid">
              <OrderField label="Mesto" id="order-place" error={errors.place?.message}><input id="order-place" disabled={checkoutPreview || submitting} autoComplete="address-level2" {...register('place', { required: 'Unesite mesto' })} /></OrderField>
              <OrderField label="Poštanski broj" id="order-postal" error={errors.postalCode?.message}><input id="order-postal" disabled={checkoutPreview || submitting} inputMode="numeric" autoComplete="postal-code" {...register('postalCode', { required: 'Unesite poštanski broj' })} /></OrderField>
              <OrderField label="Ulica" id="order-street" error={errors.street?.message}><input id="order-street" disabled={checkoutPreview || submitting} autoComplete="address-line1" {...register('street', { required: 'Unesite ulicu' })} /></OrderField>
              <OrderField label="Broj" id="order-number" error={errors.number?.message}><input id="order-number" disabled={checkoutPreview || submitting} {...register('number', { required: 'Unesite broj' })} /></OrderField>
              <OrderField label="Napomena za Plant Centar (opciono)" id="order-note" wide><textarea id="order-note" rows={3} disabled={checkoutPreview || submitting} placeholder="Termin poziva, napomena za dostavu..." {...register('note')} /></OrderField>
            </div>
          </section>

          <section className="order-review">
            <div className="order-section-heading"><span>03</span><div><h2>Proizvodi</h2><p>{items.length} {items.length === 1 ? 'stavka' : 'stavke'} u porudžbini</p></div></div>
            <div className="order-items">{items.map((item) => <article key={cartKey(item)} className="order-item"><img src={item.image || productPlaceholder} alt={item.name} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} /><div><h3>{item.name}</h3><p>Količina: {item.quantity}</p></div><strong>{formatPrice(item.price * item.quantity)}</strong></article>)}</div>
          </section>
        </div>

        <aside className="order-summary">
          <span className="order-eyebrow">Pregled iznosa</span>
          <dl><div><dt>Proizvodi</dt><dd>{formatPrice(subtotal)}</dd></div><div><dt>Dostava</dt><dd>Po dogovoru</dd></div></dl>
          <div className="order-total"><span>Ukupno bez dostave</span><strong>{formatPrice(total)}</strong></div>
          <p className="order-contact-note">Cena dostave zavisi od pakovanja i potvrđuje se pri dogovoru.</p>
          <label className="order-consent"><input type="checkbox" disabled={checkoutPreview || submitting} {...register('privacyAccepted', { required: 'Potvrdite saglasnost za obradu podataka' })} /><span>Saglasan/na sam da Plant Centar koristi unete podatke za obradu ove porudžbine.</span></label>
          {errors.privacyAccepted && <span className="order-consent-error">{errors.privacyAccepted.message}</span>}
          <button className="order-primary" type="submit" disabled={submitting || checkoutPreview}>{checkoutPreview ? 'Pregled — čuvanje isključeno' : submitting ? 'Čuvamo porudžbinu...' : 'Pošalji porudžbinu'}</button>
          <button className="order-back" type="button" onClick={() => navigate('/korpa')} disabled={submitting}>Nazad u korpu</button>
          <p className="order-contact-note">Ovo nije automatska naplata. Administrator potvrđuje dostupnost, dostavu i način plaćanja sa vama.</p>
        </aside>
      </form>
    </main>
  );
};

function OrderField({ label, id, error, wide, children }: { label: string; id: string; error?: string; wide?: boolean; children: ReactNode }) {
  return <div className={`order-field${wide ? ' order-field-wide' : ''}`}><label htmlFor={id}>{label}</label>{children}{error && <span>{error}</span>}</div>;
}

export default Order;
