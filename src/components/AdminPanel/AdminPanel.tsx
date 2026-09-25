import { type ProductOptions, availabilityLabels, effectivePrice, packageHasDiscount, productHasDiscount } from '../../data/productOptions';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import { ScaleLoader } from 'react-spinners';
import { auth, db, storage } from '../firebase';
import { RootState } from '../Redux/store';
import { logout } from '../Redux/authSlice';
import ProductEditorModal from '../Modals/ProductEditorModal';
import Filter from '../Filter/Filter';
import Sort from '../Sort/Sort';
import productPlaceholder from '../../assets/product-placeholder.svg';
import { catalogCategories, getSubcategories } from '../../data/catalogCategories';
import AdminOrders from '../AdminOrders/AdminOrders';
import AdminNews from '../AdminNews/AdminNews';
import './AdminPanel.css';

export type Product = ProductOptions & {
  productId: string; name: string; category: string; subcategory: string; manufacturer: string;
  packaging?: string;
  price: number; images: string[]; description: string;
  onDiscount?: boolean; discountPrice?: number;
};

type DeleteTarget = { productId: string; images: string[] } | null;
type ProductStatus = 'all' | 'regular' | 'discount' | 'missingImage' | 'archived' | 'active';
type PaginationItem = { key: string; page?: number; label: string };

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      key: `page-${index + 1}`,
      page: index + 1,
      label: String(index + 1),
    }));
  }

  const visiblePages = Array.from(new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]))
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
  const items: PaginationItem[] = [];
  visiblePages.forEach((page, index) => {
    const previousPage = visiblePages[index - 1];
    if (previousPage && page - previousPage > 1) items.push({ key: `ellipsis-${previousPage}-${page}`, label: '…' });
    items.push({ key: `page-${page}`, page, label: String(page) });
  });
  return items;
};

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
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const [manufacturerFilterResetKey, setManufacturerFilterResetKey] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus>('all');
  const [sortBy, setSortBy] = useState('nameAsc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
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

  const availableManufacturers = useMemo(
    () => Array.from(new Set(products.map((product) => product.manufacturer).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'sr')),
    [products],
  );

  const availableCategories = useMemo(() => {
    const productCategories = new Set(products.map((product) => product.category).filter(Boolean));
    const configured = catalogCategories.map((category) => category.label).filter((category) => productCategories.has(category));
    const unconfigured = Array.from(productCategories)
      .filter((category) => !configured.includes(category))
      .sort((a, b) => a.localeCompare(b, 'sr'));
    return [...configured, ...unconfigured];
  }, [products]);

  const availableSubcategories = useMemo(() => {
    const productSubcategories = products
      .filter((product) => !categoryFilter || product.category === categoryFilter)
      .map((product) => product.subcategory)
      .filter(Boolean);
    const configured = categoryFilter
      ? getSubcategories(categoryFilter)
      : catalogCategories.flatMap((category) => category.subcategories);
    const uniqueProductSubcategories = new Set(productSubcategories);
    const configuredAvailable = configured.filter((subcategory) => uniqueProductSubcategories.has(subcategory));
    const unconfigured = Array.from(uniqueProductSubcategories)
      .filter((subcategory) => !configuredAvailable.includes(subcategory))
      .sort((a, b) => a.localeCompare(b, 'sr'));
    return [...configuredAvailable, ...unconfigured];
  }, [categoryFilter, products]);

  const filteredProducts = useMemo(() => {
    // Header search and the catalogue search box both apply; every word must match.
    const terms = `${searchQuery} ${catalogSearch}`.trim().toLocaleLowerCase('sr-Latn').split(/\s+/).filter(Boolean);
    let data = products.filter((product) => {
      if (!terms.length) return true;
      const haystack = [product.name, product.manufacturer, product.category, product.subcategory, product.packaging, ...(product.packages || []).map((option) => option.label)]
        .filter(Boolean).join(' ').toLocaleLowerCase('sr-Latn');
      return terms.every((term) => haystack.includes(term));
    });
    if (manufacturerFilter.length) data = data.filter((product) => manufacturerFilter.includes(product.manufacturer));
    if (categoryFilter) data = data.filter((product) => product.category === categoryFilter);
    if (subcategoryFilter) data = data.filter((product) => product.subcategory === subcategoryFilter);
    if (statusFilter === 'archived') data = data.filter((product) => product.archived);
    if (statusFilter === 'active') data = data.filter((product) => !product.archived);
    if (statusFilter === 'regular') data = data.filter((product) => !productHasDiscount(product));
    if (statusFilter === 'discount') data = data.filter((product) => productHasDiscount(product));
    if (statusFilter === 'missingImage') data = data.filter((product) => !product.images?.length);

    return [...data].sort((a, b) => {
      if (sortBy === 'priceAsc') return Number(a.price) - Number(b.price);
      if (sortBy === 'priceDesc') return Number(b.price) - Number(a.price);
      if (sortBy === 'nameDesc') return b.name.localeCompare(a.name, 'sr');
      return a.name.localeCompare(b.name, 'sr');
    });
  }, [products, searchQuery, catalogSearch, manufacturerFilter, categoryFilter, subcategoryFilter, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [currentPage, filteredProducts, pageSize]);
  const paginationItems = useMemo(() => getPaginationItems(currentPage, totalPages), [currentPage, totalPages]);
  const resultStart = filteredProducts.length ? (currentPage - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(currentPage * pageSize, filteredProducts.length);
  const activeFilterCount = Number(Boolean(catalogSearch.trim())) + manufacturerFilter.length +Number(Boolean(categoryFilter)) + Number(Boolean(subcategoryFilter)) + Number(statusFilter !== 'all');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, catalogSearch, manufacturerFilter, categoryFilter, subcategoryFilter, statusFilter, sortBy, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (subcategoryFilter && !availableSubcategories.includes(subcategoryFilter)) setSubcategoryFilter('');
  }, [availableSubcategories, subcategoryFilter]);

  const formatPrice = (price: number) => new Intl.NumberFormat('sr-RS', {
    style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(price) || 0);

  const clearCatalogFilters = () => {
    setCatalogSearch('');
    setManufacturerFilter([]);
    setManufacturerFilterResetKey((key) => key + 1);
    setCategoryFilter('');
    setSubcategoryFilter('');
    setStatusFilter('all');
  };

  const handleManufacturerFilterChange = useCallback((filters: { manufacturers: string[] }) => {
    setManufacturerFilter(filters.manufacturers);
  }, []);

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
      const imagesUsedByOtherProducts = new Set(
        products
          .filter((product) => product.productId !== deleteTarget.productId)
          .flatMap((product) => product.images || []),
      );
      await deleteDoc(doc(db, 'products', deleteTarget.productId));
      await Promise.all(deleteTarget.images.filter((image) => !imagesUsedByOtherProducts.has(image)).map(async (image) => {
        try {
          await deleteObject(ref(storage, image));
        } catch (error) {
          console.warn('Image could not be removed from storage:', error);
        }
      }));
      setProducts((current) => current.filter((product) => product.productId !== deleteTarget.productId));
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setDeleteTarget(null);
    }
  };

  const stats = {
    total: products.length,
    discounts: products.filter((product) => productHasDiscount(product)).length,
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

  const getImagesUsedByOtherProducts = (productId: string) => new Set(
    products
      .filter((product) => product.productId !== productId)
      .flatMap((product) => product.images || []),
  );

  return (
    <main className="admin-panel-container">
      {!previewMode && newItemClicked && <ProductEditorModal onClose={() => setNewItemClicked(false)} onSaved={(product) => { setProducts((current) => [product, ...current]); setNewItemClicked(false); setCurrentPage(1); }} />}
      {!previewMode && selectedProduct && <ProductEditorModal product={selectedProduct} protectedImageUrls={getImagesUsedByOtherProducts(selectedProduct.productId)} onClose={() => setSelectedProduct(null)} onSaved={(product) => { setProducts((current) => current.map((item) => item.productId === product.productId ? product : item)); setSelectedProduct(null); }} />}
      {!previewMode && duplicateProduct && <ProductEditorModal product={duplicateProduct} duplicate protectedImageUrls={new Set(duplicateProduct.images || [])} onClose={() => setDuplicateProduct(null)} onSaved={(product) => { setProducts((current) => [product, ...current]); setDuplicateProduct(null); setCurrentPage(1); }} />}
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
        <aside className="admin-sidebar">
          <div className="admin-sidebar-heading"><strong>Prikaz kataloga</strong><span>{filteredProducts.length} rezultata</span></div>
          <div className="admin-sort-filter-wrapper">
            <label className="admin-catalog-search">
              <span className="sr-only">Pretraga artikala</span>
              <SearchIcon aria-hidden="true" />
              <input type="search" value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Pretraži naziv, proizvođača, pakovanje…" />
              {catalogSearch && <button type="button" onClick={() => setCatalogSearch('')} aria-label="Obriši pretragu"><CloseIcon /></button>}
            </label>
            <Sort onSortChange={setSortBy} />
            <section className="admin-catalog-filters" aria-label="Filteri kategorija i statusa">
              <div className="admin-filter-title"><span><FilterAltOutlinedIcon /> Dodatni filteri</span>{activeFilterCount > 0 && <strong>{activeFilterCount}</strong>}</div>
              <label><span>Kategorija</span><select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setSubcategoryFilter(''); }}><option value="">Sve kategorije</option>{availableCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label><span>Podkategorija</span><select value={subcategoryFilter} onChange={(event) => setSubcategoryFilter(event.target.value)} disabled={!availableSubcategories.length}><option value="">Sve podkategorije</option>{availableSubcategories.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}</select></label>
              <label><span>Status artikla</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProductStatus)}><option value="all">Svi artikli</option><option value="active">Aktivni</option><option value="archived">Arhivirani</option><option value="regular">Redovna cena</option><option value="discount">Na akciji</option><option value="missingImage">Bez fotografije</option></select></label>
              <button className="admin-clear-filters" type="button" onClick={clearCatalogFilters} disabled={!activeFilterCount}><RestartAltIcon /> Poništi dodatne filtere</button>
            </section>
            <Filter onFilterChange={handleManufacturerFilterChange} availableManufacturers={availableManufacturers} resetKey={manufacturerFilterResetKey} />
          </div>
        </aside>

        <section className="admin-main-content">
          {loading ? <div className="admin-loader"><ScaleLoader color="#287b35" /></div> : !filteredProducts.length ? <div className="admin-empty"><div><h2>Nema proizvoda za prikaz</h2><p>Promenite filter ili termin pretrage.</p>{activeFilterCount > 0 && <button type="button" onClick={clearCatalogFilters}>Poništi filtere</button>}</div></div> : (
            <div className="admin-table-card">
              <div className="table-container"><table className="product-table">
                <thead><tr><th>Proizvod</th><th>Kategorija</th><th>Cena</th><th>Status</th><th>Fotografije</th><th><span className="sr-only">Akcije</span></th></tr></thead>
                <tbody>{paginatedProducts.map((product) => (
                  <tr key={product.productId} className={previewMode ? '' : 'product-row'} onClick={() => !previewMode && setSelectedProduct(product)}>
                    <td><div className="admin-product-cell"><img src={product.images?.[0] || productPlaceholder} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} /><div><strong>{product.name}</strong><span>{product.manufacturer || 'Bez proizvođača'}{product.packaging ? ` · ${product.packaging}` : ''}</span></div></div></td>
                    <td><strong className="admin-category">{product.category || '—'}</strong><span className="admin-subcategory">{product.subcategory || 'Bez podkategorije'}</span></td>
                    <td><strong className="admin-price">{product.packages?.length ? 'Od ' : ''}{formatPrice(effectivePrice(product))}</strong>{product.packages?.length ? (productHasDiscount(product) ? <span className="admin-subcategory">Na akciji: {product.packages.filter(packageHasDiscount).map((option) => option.label).join(', ')}</span> : null) : productHasDiscount(product) ? <del>{formatPrice(product.price)}</del> : null}</td>
                    <td>{product.archived ? <span className="admin-badge">Arhiviran</span> : <span className="admin-badge">{availabilityLabels[product.availability || 'on_order']}</span>}{productHasDiscount(product) ? <span className="admin-badge admin-badge-sale">Akcija</span> : <span className="admin-badge">Redovna cena</span>}{product.seasonal ? <span className="admin-badge">Sezonska ponuda</span> : null}</td>
                    <td onClick={(event) => event.stopPropagation()}><div className="admin-thumbnails">{(product.images || []).slice(0, 4).map((image, index) => <button key={`${image}-${index}`} title={previewMode ? 'Pregled je samo za čitanje' : 'Postavi kao glavnu fotografiju'} disabled={previewMode} onClick={() => handleImageSelect(product, index)}><img src={image} alt={`${product.name} ${index + 1}`} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = productPlaceholder; }} /></button>)}{!product.images?.length && <span className="admin-no-image">Nema slika</span>}</div></td>
                    <td onClick={(event) => event.stopPropagation()}><div className="admin-row-actions"><button className="admin-duplicate-button" title={previewMode ? 'Pregled je samo za čitanje' : 'Dupliciraj za drugo pakovanje'} disabled={previewMode} onClick={() => setDuplicateProduct(product)} aria-label={`Dupliciraj ${product.name}`}><ContentCopyOutlinedIcon /></button><button className="admin-delete-button" title={previewMode ? 'Pregled je samo za čitanje' : 'Obriši proizvod'} disabled={previewMode} onClick={() => setDeleteTarget({ productId: product.productId, images: product.images || [] })} aria-label={`Obriši ${product.name}`}><DeleteOutlineIcon /></button></div></td>
                  </tr>
                ))}</tbody>
              </table></div>
              <nav className="admin-pagination" aria-label="Stranice kataloga">
                <div className="admin-pagination-summary"><strong>{resultStart}–{resultEnd}</strong><span>od {filteredProducts.length} proizvoda</span></div>
                <label className="admin-page-size"><span>Po strani</span><select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
                <div className="admin-page-controls">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Prethodna stranica"><NavigateBeforeIcon /></button>
                  {paginationItems.map((item) => item.page ? <button type="button" key={item.key} className={item.page === currentPage ? 'active' : ''} onClick={() => setCurrentPage(item.page as number)} aria-current={item.page === currentPage ? 'page' : undefined}>{item.label}</button> : <span key={item.key}>{item.label}</span>)}
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="Sledeća stranica"><NavigateNextIcon /></button>
                </div>
              </nav>
            </div>
          )}
        </section>
      </div></>}
    </main>
  );
}
