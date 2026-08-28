import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { auth, db, storage } from '../firebase';
import { RootState } from '../Redux/store';
import { logout } from '../Redux/authSlice';
import AddItemModal from '../Modals/NewItemModal';
import EditItemModal from '../Modals/EditItemModal';
import Filter from '../Filter/Filter';
import Sort from '../Sort/Sort';
import productPlaceholder from '../../assets/product-placeholder.svg';
import AdminOrders from '../AdminOrders/AdminOrders';
import AdminNews from '../AdminNews/AdminNews';
import './AdminPanel.css';

type Product = {
  productId: string; name: string; category: string; subcategory: string; manufacturer: string;
  gender: 'male' | 'female'; size: string[]; price: number; images: string[]; description: string;
  onDiscount?: boolean; discountPrice?: number;
};

type DeleteTarget = { productId: string; images: string[] } | null;

export default function AdminPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const previewMode = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === 'admin';
  const searchQuery = useSelector((state: RootState) => state.search.query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemClicked, setNewItemClicked] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('nameAsc');
  const [activeView, setActiveView] = useState<'orders' | 'products' | 'news'>('orders');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      setProducts(snapshot.docs.map((productDoc) => ({
        productId: productDoc.id,
        ...(productDoc.data() as Omit<Product, 'productId'>),
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const availableManufacturers = useMemo(() => Array.from(new Set(products.map((product) => product.manufacturer).filter(Boolean))).sort(), [products]);
  const displayedProducts = useMemo(() => {
    let data = products.filter((product) => !searchQuery.trim() || product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (manufacturerFilter.length) data = data.filter((product) => manufacturerFilter.includes(product.manufacturer));
    return [...data].sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'nameDesc') return b.name.localeCompare(a.name);
      return a.name.localeCompare(b.name);
    });
  }, [products, searchQuery, manufacturerFilter, sortBy]);

  const formatPrice = (price: number) => new Intl.NumberFormat('sr-RS', {
    style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price);

  const handleImageSelect = async (product: Product, imageIndex: number) => {
    if (previewMode || imageIndex === 0 || !product.images?.[imageIndex]) return;
    const images = [...product.images];
    const selectedImage = images.splice(imageIndex, 1)[0];
    images.unshift(selectedImage);
    try {
      await updateDoc(doc(db, 'products', product.productId), { images });
      setProducts((current) => current.map((item) => item.productId === product.productId ? { ...item, images } : item));
    } catch (error) {
      console.error('Error updating product images:', error);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget || previewMode) return;
    try {
      await deleteDoc(doc(db, 'products', deleteTarget.productId));
      await Promise.all(deleteTarget.images.map((image) => deleteObject(ref(storage, image))));
      setProducts((current) => current.filter((product) => product.productId !== deleteTarget.productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const stats = {
    total: products.length,
    discounts: products.filter((product) => product.onDiscount).length,
    brands: availableManufacturers.length,
    missingImages: products.filter((product) => !product.images?.length).length,
  };

  const handleAdminLogout = async () => {
    if (!previewMode) {
      await signOut(auth);
      dispatch(logout());
    }
    navigate(previewMode ? '/početna' : '/admin/prijava');
  };

  return (
    <main className="admin-panel-container">
      {!previewMode && newItemClicked && <AddItemModal onClose={() => { setNewItemClicked(false); fetchProducts(); }} onProductAdded={(product) => setProducts((current) => [product, ...current])} />}
      {!previewMode && selectedProduct && <EditItemModal product={selectedProduct} onClose={() => { setSelectedProduct(null); fetchProducts(); }} />}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogContent>Da li ste sigurni da želite da obrišete ovaj proizvod?</DialogContent>
        <DialogActions><Button onClick={() => setDeleteTarget(null)} color="inherit">Odustani</Button><Button onClick={handleDeleteConfirmed} color="error">Obriši</Button></DialogActions>
      </Dialog>

      {previewMode && <div className="admin-preview-banner"><LockOutlinedIcon /><div><strong>Administratorski pregled — samo za čitanje</strong><span>Promene statusa porudžbine i izmene kataloga isključene su u lokalnom pregledu.</span></div></div>}

      <div className="admin-topbar"><nav className="admin-section-tabs" aria-label="Sekcije administracije">
        <button className={activeView === 'orders' ? 'active' : ''} onClick={() => setActiveView('orders')}>Porudžbine</button>
        <button className={activeView === 'products' ? 'active' : ''} onClick={() => setActiveView('products')}>Proizvodi</button>
        <button className={activeView === 'news' ? 'active' : ''} onClick={() => setActiveView('news')}>Vesti</button>
      </nav><button className="admin-logout-button" onClick={handleAdminLogout}><LogoutOutlinedIcon />{previewMode ? 'Izađi iz pregleda' : 'Odjavi se'}</button></div>

      <header className="admin-heading">
        <div><span className="admin-eyebrow">Administracija</span><h1>{activeView === 'orders' ? 'Porudžbine' : activeView === 'products' ? 'Katalog proizvoda' : 'Aktuelnosti'}</h1><p>{activeView === 'orders' ? 'Pregledajte nove zahteve, kontaktirajte kupce i zatvorite završene porudžbine.' : activeView === 'products' ? 'Upravljajte asortimanom, cenama, slikama i akcijskim ponudama.' : 'Pišite i objavljujte vesti koje se prikazuju na Plant Centar sajtu.'}</p></div>
        {activeView === 'products' && <button className="admin-add-button" onClick={() => !previewMode && setNewItemClicked(true)} disabled={previewMode}><AddCircleOutlineIcon /> Dodaj proizvod</button>}
      </header>

      {activeView === 'orders' ? <AdminOrders previewMode={previewMode} /> : activeView === 'news' ? <AdminNews previewMode={previewMode} /> : <><section className="admin-stats" aria-label="Pregled kataloga">
        <article><span>Ukupno proizvoda</span><strong>{stats.total}</strong></article>
        <article><span>Na popustu</span><strong>{stats.discounts}</strong></article>
        <article><span>Proizvođači</span><strong>{stats.brands}</strong></article>
        <article className={stats.missingImages ? 'admin-stat-warning' : ''}><span>Bez fotografije</span><strong>{stats.missingImages}</strong></article>
      </section>

      <div className="admin-workspace">
        <aside className="admin-sidebar"><div className="admin-sidebar-heading"><strong>Prikaz kataloga</strong><span>{displayedProducts.length} rezultata</span></div><div className="admin-sort-filter-wrapper"><Sort onSortChange={setSortBy} /><Filter onFilterChange={(filters) => setManufacturerFilter(filters.manufacturers)} availableManufacturers={availableManufacturers} /></div></aside>

        <section className="admin-main-content">
          {loading ? <div className="admin-loader"><ScaleLoader color="#287b35" /></div> : !displayedProducts.length ? <div className="admin-empty"><h2>Nema proizvoda za prikaz</h2><p>Promenite filter ili termin pretrage.</p></div> : (
            <div className="table-container">
              <table className="product-table">
                <thead><tr><th>Proizvod</th><th>Kategorija</th><th>Cena</th><th>Status</th><th>Fotografije</th><th><span className="sr-only">Akcije</span></th></tr></thead>
                <tbody>{displayedProducts.map((product) => (
                  <tr key={product.productId} className={previewMode ? '' : 'product-row'} onClick={() => !previewMode && setSelectedProduct(product)}>
                    <td><div className="admin-product-cell"><img src={product.images?.[0] || productPlaceholder} alt="" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} /><div><strong>{product.name}</strong><span>{product.manufacturer || 'Bez proizvođača'}</span></div></div></td>
                    <td><strong className="admin-category">{product.category || '—'}</strong><span className="admin-subcategory">{product.subcategory || 'Bez podkategorije'}</span></td>
                    <td><strong className="admin-price">{formatPrice(product.onDiscount && product.discountPrice ? product.discountPrice : product.price)}</strong>{product.onDiscount && product.discountPrice ? <del>{formatPrice(product.price)}</del> : null}</td>
                    <td>{product.onDiscount ? <span className="admin-badge admin-badge-sale">Akcija</span> : <span className="admin-badge">Redovna cena</span>}</td>
                    <td onClick={(event) => event.stopPropagation()}><div className="admin-thumbnails">{(product.images || []).slice(0, 4).map((image, index) => <button key={`${image}-${index}`} title={previewMode ? 'Pregled je samo za čitanje' : 'Postavi kao glavnu fotografiju'} disabled={previewMode} onClick={() => handleImageSelect(product, index)}><img src={image} alt={`${product.name} ${index + 1}`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} /></button>)}{!product.images?.length && <span className="admin-no-image">Nema slika</span>}</div></td>
                    <td onClick={(event) => event.stopPropagation()}><button className="admin-delete-button" title={previewMode ? 'Pregled je samo za čitanje' : 'Obriši proizvod'} disabled={previewMode} onClick={() => setDeleteTarget({ productId: product.productId, images: product.images || [] })}><DeleteOutlineIcon /></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>
      </div></>}
    </main>
  );
}
