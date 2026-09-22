import { type ProductOptions, availabilityLabels } from '../../data/productOptions';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { toast } from 'react-toastify';
import { db } from '../firebase';
import { addToCart } from '../Redux/cartSlice';
import productPlaceholder from '../../assets/product-placeholder.svg';
import Loader from '../Loader/Loader';
import './ItemDetails.css';

type Product = ProductOptions & {
  productId: string;
  name: string;
  price: number;
  images: string[];
  description?: string;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
  packaging?: string;
  onDiscount?: boolean;
  discountPrice?: number | null;
};

export default function ItemDetails() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [packageId, setPackageId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setProduct(null); setQuantity(1); setPackageId('');
      try {
        if (!productId) throw new Error('Product ID is undefined');
        const productSnapshot = await getDoc(doc(db, 'products', productId));
        if (!productSnapshot.exists()) return;
        const data = productSnapshot.data();
        if (data.archived) return;
        const productImages = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
        setProduct({
          productId: productSnapshot.id,
          packages: data.packages || [], availability: data.availability || 'on_order',
          name: data.name || 'Proizvod',
          price: Number(data.price) || 0,
          images: productImages,
          description: data.description || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          manufacturer: data.manufacturer || '',
          packaging: data.packaging || '',
          onDiscount: Boolean(data.onDiscount),
          discountPrice: typeof data.discountPrice === 'number' ? data.discountPrice : null,
        });
        setSelectedImage(productImages[0] || null);
        setPackageId(data.packages?.[0]?.id || '');
      } catch (error) {
        console.error('Error fetching product details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  const formatPrice = (price: number) => new Intl.NumberFormat('sr-RS', {
    style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);

  const selectedPackage = product?.packages?.find((option) => option.id === packageId);
  const availability = selectedPackage?.availability || product?.availability || 'on_order';
  const sellingPrice = selectedPackage?.price ?? (product?.onDiscount && product.discountPrice ? product.discountPrice : product?.price || 0);
  const handleAddToCart = () => {
    if (!product || availability === 'out_of_stock') return;

    dispatch(addToCart({
      productId: product.productId,
      packageId: selectedPackage?.id || '',
      name: product.name + ((selectedPackage?.label || product.packaging) ? ` · ${selectedPackage?.label || product.packaging}` : ''),
      price: sellingPrice,
      image: product.images[0] || selectedImage || '',
      quantity,
    }));
    toast.success('Proizvod je uspešno dodat u korpu!');
  };

  return (
    <main className="item-details-container">
      {loading ? <Loader label="Učitavamo proizvod" /> : product ? (
        <div className="item-details-page">
          <nav className="product-breadcrumb" aria-label="Putanja">
            <Link to="/početna">Početna</Link><span>/</span>
            {product.category && <><span>{product.category}</span><span>/</span></>}
            <strong>{product.name}</strong>
          </nav>
          <div className="item-details-wrapper">
            <section className="product-images" aria-label="Fotografije proizvoda">
              <div className="main-image-container">
                <img src={selectedImage || productPlaceholder} alt={product.name} className="main-image" loading="eager" decoding="async" fetchPriority="high" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} />
              </div>
              {product.images.length > 1 && <div className="thumbnail-strip">
                {product.images.map((image, index) => (
                  <button type="button" key={image || index} className={`thumbnail-button ${selectedImage === image ? 'active' : ''}`} onClick={() => setSelectedImage(image)} aria-label={`Prikaži fotografiju ${index + 1}`}>
                    <img src={image} alt={`${product.name}, fotografija ${index + 1}`} className="thumbnail" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} />
                  </button>
                ))}
              </div>}
            </section>

            <section className="product-details">
              <div className="product-meta-row">
                {product.manufacturer && <span>{product.manufacturer}</span>}
                <span role="status">{availabilityLabels[availability]}</span>
              </div>
              <h1 className="product-title">{product.name}</h1>
              {!!product.packages?.length && <label className="package-selector">Izaberite pakovanje<select value={packageId} onChange={(event) => { setPackageId(event.target.value); setQuantity(1); }}>{product.packages.map((option) => <option key={option.id} value={option.id}>{option.label} — {formatPrice(option.price)} · {availabilityLabels[option.availability]}</option>)}</select></label>}
              <div className="product-price-block">
                <p className="product-price">{formatPrice(sellingPrice)}</p>
                {!selectedPackage && product.onDiscount && product.discountPrice ? <><del>{formatPrice(product.price)}</del><span>Ušteda {formatPrice(product.price - product.discountPrice)}</span></> : null}
              </div>
              <dl className="product-facts">
                {product.category && <div><dt>Kategorija</dt><dd>{product.category}</dd></div>}
                {product.subcategory && <div><dt>Namena</dt><dd>{product.subcategory}</dd></div>}
                {product.manufacturer && <div><dt>Proizvođač</dt><dd>{product.manufacturer}</dd></div>}
                {!selectedPackage && product.packaging && <div><dt>Pakovanje</dt><dd>{product.packaging}</dd></div>}
              </dl>

              <div className="quantity-actions">
                <label htmlFor="product-quantity">Količina</label>
                <div className="quantity-input-wrapper">
                  <button type="button" className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Smanji količinu">−</button>
                  <input id="product-quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number.parseInt(event.target.value, 10) || 1))} />
                  <button type="button" className="qty-btn" onClick={() => setQuantity(quantity + 1)} aria-label="Povećaj količinu">+</button>
                </div>
              </div>
              <button disabled={availability === 'out_of_stock'} className="add-to-cart-button" onClick={handleAddToCart}><ShoppingBagOutlinedIcon /> Dodaj u korpu</button>
              <div className="product-service-notes">
                <span><VerifiedOutlinedIcon />Proverena ponuda</span>
                <span><SupportAgentOutlinedIcon />Stručna podrška</span>
                <span><LocalShippingOutlinedIcon />Dostava širom Srbije</span>
              </div>
            </section>
          </div>
              {product.description ? <div className="product-description"><h2>Opis proizvoda</h2><p>{product.description}</p></div> : <div className="product-description product-description--empty"><h2>Informacije o proizvodu</h2><p>Za dodatne informacije o primeni i dostupnosti kontaktirajte naš stručni tim.</p></div>}
        </div>
      ) : <div className="product-not-found"><h1>Proizvod nije pronađen</h1><Link to="/početna">Nazad na ponudu</Link></div>}
    </main>
  );
}
