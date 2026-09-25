import { type Availability, type PackageOption, type ProductOptions, availabilityLabels, packageHasDiscount } from '../../data/productOptions';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { toast } from 'react-toastify';
import { db, storage } from '../firebase';
import { RootState } from '../Redux/store';
import { catalogCategories, getSubcategories } from '../../data/catalogCategories';
import './ProductEditorModal.css';

type Product = ProductOptions & {
  productId: string;
  name: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  packaging?: string;
  price: number;
  images: string[];
  description: string;
  onDiscount?: boolean;
  discountPrice?: number;
};

type PreviewItem = {
  id: string;
  url: string;
  file?: File;
  existing: boolean;
};

type ProductEditorModalProps = {
  product?: Product;
  duplicate?: boolean;
  protectedImageUrls?: Set<string>;
  onClose: () => void;
  onSaved: (product: Product) => void;
};

const MAX_IMAGES = 5;

const normalizePrice = (value: string) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.round((parsedValue + Number.EPSILON) * 100) / 100 : Number.NaN;
};

const uploadImage = (file: File, onProgress: (progress: number) => void) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const imageRef = ref(storage, `images/${Date.now()}-${crypto.randomUUID()}-${safeName}`);
  const uploadTask = uploadBytesResumable(imageRef, file);
  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      reject,
      async () => resolve(await getDownloadURL(uploadTask.snapshot.ref)),
    );
  });
};

export default function ProductEditorModal({ product, duplicate = false, protectedImageUrls = new Set(), onClose, onSaved }: ProductEditorModalProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const editing = Boolean(product) && !duplicate;
  const duplicating = Boolean(product) && duplicate;
  const [archived, setArchived] = useState(duplicate ? false : product?.archived || false);
  const [seasonal, setSeasonal] = useState(product?.seasonal || false);
  const [availability, setAvailability] = useState<Availability>(product?.availability || 'on_order');
  const [packages, setPackages] = useState<PackageOption[]>(product?.packages || []);
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? '');
  const [manufacturer, setManufacturer] = useState(product?.manufacturer ?? '');
  const [packaging, setPackaging] = useState(duplicating ? '' : product?.packaging ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [onDiscount, setOnDiscount] = useState(product?.onDiscount ?? false);
  const [discountPrice, setDiscountPrice] = useState(product?.discountPrice ? String(product.discountPrice) : '');
  const [previews, setPreviews] = useState<PreviewItem[]>(() => (product?.images ?? []).map((url, index) => ({ id: `existing-${index}-${url}`, url, existing: true })));
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const localObjectUrls = useRef<string[]>([]);
  const subcategories = useMemo(() => getSubcategories(category), [category]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading, onClose]);

  useEffect(() => () => {
    localObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const handleCategoryChange = (nextCategory: string) => {
    setCategory(nextCategory);
    if (!getSubcategories(nextCategory).includes(subcategory)) setSubcategory('');
  };

  const handleImagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (!selectedFiles.length) return;
    if (previews.length + selectedFiles.length > MAX_IMAGES) {
      toast.error(`Možete dodati najviše ${MAX_IMAGES} fotografija.`);
      event.target.value = '';
      return;
    }
    const newPreviews = selectedFiles.map((file) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(file), file, existing: false }));
    localObjectUrls.current.push(...newPreviews.map((preview) => preview.url));
    setPreviews((current) => [...current, ...newPreviews]);
    event.target.value = '';
  };

  const removeImage = (id: string) => {
    const selected = previews.find((preview) => preview.id === id);
    if (!selected) return;
    if (selected.existing && editing && !protectedImageUrls.has(selected.url)) setRemovedImages((current) => [...current, selected.url]);
    else {
      URL.revokeObjectURL(selected.url);
      localObjectUrls.current = localObjectUrls.current.filter((url) => url !== selected.url);
    }
    setPreviews((current) => current.filter((preview) => preview.id !== id));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const regularPrice = packages.length ? Math.min(...packages.map((option) => option.price)) : normalizePrice(price);
    const salePrice = normalizePrice(discountPrice);
    if (!category || !subcategory) {
      toast.error('Izaberite kategoriju i podkategoriju.');
      return;
    }
    if (duplicating && (!packaging.trim() || packaging.trim().toLocaleLowerCase('sr-Latn') === product?.packaging?.trim().toLocaleLowerCase('sr-Latn'))) {
      toast.error('Unesite novo pakovanje koje se razlikuje od originalnog proizvoda.');
      return;
    }
    if (!Number.isFinite(regularPrice) || regularPrice <= 0) {
      toast.error('Unesite ispravnu cenu proizvoda.');
      return;
    }
    if (!packages.length && onDiscount && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= regularPrice)) {
      toast.error('Akcijska cena mora biti veća od nule i niža od redovne cene.');
      return;
    }
    if (!previews.length) {
      toast.error('Dodajte najmanje jednu fotografiju proizvoda.');
      return;
    }

    if (packages.some((option) => !option.label.trim() || !Number.isFinite(option.price) || option.price <= 0) || new Set(packages.map((option) => option.label.trim().toLowerCase())).size !== packages.length) {
      toast.error('Svako pakovanje mora imati jedinstven naziv i cenu veću od nule.'); return;
    }
    if (packages.some((option) => option.discountPrice !== undefined && (!Number.isFinite(option.discountPrice) || option.discountPrice <= 0 || option.discountPrice >= option.price))) {
      toast.error('Akcijska cena pakovanja mora biti veća od nule i niža od redovne cene pakovanja.'); return;
    }
    setLoading(true);
    try {
      const existingImages = previews.filter((preview) => preview.existing).map((preview) => preview.url);
      const filesToUpload = previews.filter((preview) => preview.file);
      const uploadedImages: string[] = [];
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const preview = filesToUpload[index];
        if (!preview.file) continue;
        const url = await uploadImage(preview.file, (fileProgress) => {
          setUploadProgress(((index + fileProgress / 100) / filesToUpload.length) * 100);
        });
        uploadedImages.push(url);
      }

      const savedProductData = {
        archived, seasonal, availability, packages: packages.map((option) => {
          const entry: PackageOption = { id: option.id, label: option.label.trim(), price: option.price, availability: option.availability };
          if (packageHasDiscount(option)) entry.discountPrice = option.discountPrice!;
          return entry;
        }),
        name: name.trim(),
        category,
        subcategory,
        manufacturer: manufacturer.trim(),
        packaging: packaging.trim(),
        price: regularPrice,
        description: description.trim(),
        images: [...existingImages, ...uploadedImages],
        onDiscount: !packages.length && onDiscount,
        discountPrice: !packages.length && onDiscount ? salePrice : null,
      };

      let savedProduct: Product;
      if (editing && product) {
        await updateDoc(doc(db, 'products', product.productId), savedProductData);
        savedProduct = { ...savedProductData, productId: product.productId, discountPrice: !packages.length && onDiscount ? salePrice : undefined };
      } else {
        const createdDocument = await addDoc(collection(db, 'products'), { ...savedProductData, createdAt: serverTimestamp() });
        savedProduct = { ...savedProductData, productId: createdDocument.id, discountPrice: !packages.length && onDiscount ? salePrice : undefined };
      }

      await Promise.all(removedImages.map(async (imageUrl) => {
        try {
          await deleteObject(ref(storage, imageUrl));
        } catch (error) {
          console.warn('Removed image is not stored in the active Firebase bucket:', error);
        }
      }));

      toast.success(editing ? 'Proizvod je uspešno izmenjen.' : duplicating ? 'Kopija proizvoda je uspešno napravljena.' : 'Proizvod je uspešno dodat.');
      onSaved(savedProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Čuvanje proizvoda nije uspelo. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) return null;

  return (
    <div className="product-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <form className="product-editor" onSubmit={handleSubmit} aria-labelledby="product-editor-title">
        <header className="product-editor__header">
          <div><span>Katalog proizvoda</span><h2 id="product-editor-title">{editing ? 'Izmena proizvoda' : duplicating ? 'Novo pakovanje proizvoda' : 'Novi proizvod'}</h2><p>{editing ? 'Ažurirajte podatke, cenu i fotografije odabranog artikla.' : duplicating ? 'Podaci su preuzeti sa originala. Unesite novo pakovanje i po potrebi prilagodite cenu.' : 'Unesite podatke potrebne da se artikal prikaže u prodavnici.'}</p></div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Zatvori"><CloseIcon /></button>
        </header>

        <div className="product-editor__body">
          <section className="product-editor__section product-editor__section--wide">
            <div className="product-editor__section-heading"><i aria-hidden="true"><Inventory2OutlinedIcon /></i><div><strong>Osnovni podaci</strong><span>Naziv, klasifikacija i proizvođač</span></div></div>
            <div className="product-editor__grid">
              <label className="product-editor__field product-editor__field--wide"><span>Naziv proizvoda</span><input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Na primer: Verimark 10 ml" required autoFocus={!duplicating} /></label>
              <label className="product-editor__field"><span>Kategorija</span><select value={category} onChange={(event) => handleCategoryChange(event.target.value)} required><option value="">Izaberite kategoriju</option>{catalogCategories.map((item) => <option key={item.label} value={item.label}>{item.label}</option>)}</select></label>
              <label className="product-editor__field"><span>Podkategorija</span><select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} required disabled={!category}><option value="">Izaberite podkategoriju</option>{subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="product-editor__field"><span>Proizvođač</span><input type="text" value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} placeholder="Naziv proizvođača ili brenda" required /></label>
              <label className="product-editor__field"><span>Pakovanje {duplicating ? '(obavezno)' : '(opciono)'}</span><input type="text" value={packaging} onChange={(event) => setPackaging(event.target.value)} placeholder="Na primer: 1 kg, 500 g, 1 L, 250 ml" maxLength={50} required={duplicating} autoFocus={duplicating} /></label>
            </div>
          </section>

          <section className="product-editor__section">
            <div className="product-editor__section-heading"><i aria-hidden="true"><SellOutlinedIcon /></i><div><strong>Cena i ponuda</strong><span>Podesite redovnu ili akcijsku cenu</span></div></div>
            {packages.length ? <p className="product-editor__note">Artikal ima {packages.length} {packages.length === 1 ? 'pakovanje' : 'pakovanja'} — redovna i akcijska cena se podešavaju za svako pakovanje posebno u sekciji „Pakovanja“.</p> : <div className="product-editor__price-row">
              <label className="product-editor__field"><span>Redovna cena (RSD)</span><input type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} onWheel={(event) => event.currentTarget.blur()} placeholder="0,00" required /></label>
              <label className="product-editor__switch"><input type="checkbox" checked={onDiscount} onChange={(event) => setOnDiscount(event.target.checked)} /><span aria-hidden="true" /><div><strong>Artikal je na akciji</strong><small>Prikaži sniženu cenu u prodavnici</small></div></label>
              {onDiscount && <label className="product-editor__field"><span>Akcijska cena (RSD)</span><input type="number" min="0.01" step="0.01" value={discountPrice} onChange={(event) => setDiscountPrice(event.target.value)} onWheel={(event) => event.currentTarget.blur()} placeholder="0,00" required /></label>}
            </div>}
          </section>

          <section className="product-editor__section">
            <div className="product-editor__section-heading"><i aria-hidden="true"><TuneOutlinedIcon /></i><div><strong>Status i vidljivost</strong><span>Dostupnost i prikaz artikla u prodavnici</span></div></div>
            <div className="product-editor__price-row">
              <label className="product-editor__field"><span>Dostupnost artikla</span><select value={availability} onChange={(event) => setAvailability(event.target.value as Availability)}>{Object.entries(availabilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="product-editor__switch"><input type="checkbox" checked={seasonal} onChange={(event) => setSeasonal(event.target.checked)} /><span aria-hidden="true" /><div><strong>Aktuelna sezonska ponuda</strong><small>Prikaži artikal u sezonskoj sekciji na početnoj</small></div></label>
              <label className="product-editor__switch product-editor__switch--danger"><input type="checkbox" checked={archived} onChange={(event) => setArchived(event.target.checked)} /><span aria-hidden="true" /><div><strong>Arhiviraj artikal</strong><small>Sakrij artikal iz prodavnice</small></div></label>
            </div>
          </section>

          <section className="product-editor__section product-editor__section--wide">
            <div className="product-editor__section-heading product-editor__section-heading--inline"><i aria-hidden="true"><LayersOutlinedIcon /></i><div><strong>Pakovanja</strong><span>Svako pakovanje ima svoju cenu, akcijsku cenu i dostupnost</span></div>{packages.length > 0 && <b>{packages.length}</b>}</div>
            {packages.length === 0 && <p className="product-editor__note">Artikal se prodaje u jednom pakovanju. Dodajte pakovanja ako kupac bira između više veličina.</p>}
            <div className="package-editor-list">
              {packages.map((option, index) => {
                const onSale = packageHasDiscount(option);
                return <div className={`package-editor-row${onSale ? ' package-editor-row--sale' : ''}`} key={option.id}>
                  <div className="package-editor-row__header">
                    <strong>Pakovanje {index + 1}</strong>
                    {onSale && <span className="package-editor-row__badge">Akcija −{Math.round(((option.price - option.discountPrice!) / option.price) * 100)}%</span>}
                    <button type="button" className="package-editor-row__remove" onClick={() => setPackages(packages.filter((entry) => entry.id !== option.id))} aria-label={`Ukloni pakovanje ${index + 1}`} title="Ukloni pakovanje"><DeleteOutlineIcon /></button>
                  </div>
                  <div className="package-editor-row__fields">
                    <label className="product-editor__field"><span>Naziv pakovanja</span><input required value={option.label} placeholder="npr. 1 kg" onChange={(event) => setPackages(packages.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry))} /></label>
                    <label className="product-editor__field"><span>Cena (RSD)</span><input required type="number" min="0.01" step="0.01" value={option.price || ''} placeholder="0,00" onWheel={(event) => event.currentTarget.blur()} onChange={(event) => setPackages(packages.map((entry, i) => i === index ? { ...entry, price: Number(event.target.value) } : entry))} /></label>
                    <label className="product-editor__field"><span>Akcijska cena (RSD)</span><input type="number" min="0.01" step="0.01" value={option.discountPrice || ''} placeholder="Bez akcije" onWheel={(event) => event.currentTarget.blur()} onChange={(event) => setPackages(packages.map((entry, i) => i === index ? { ...entry, discountPrice: event.target.value === '' ? undefined : Number(event.target.value) } : entry))} /></label>
                    <label className="product-editor__field"><span>Dostupnost</span><select value={option.availability} onChange={(event) => setPackages(packages.map((entry, i) => i === index ? { ...entry, availability: event.target.value as Availability } : entry))}>{Object.entries(availabilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  </div>
                </div>;
              })}
            </div>
            <button type="button" className="package-editor-add" onClick={() => setPackages([...packages, { id: crypto.randomUUID(), label: '', price: 0, availability }])}><AddIcon /> Dodaj pakovanje</button>
          </section>

          <section className="product-editor__section product-editor__section--wide">
            <div className="product-editor__section-heading"><i aria-hidden="true"><DescriptionOutlinedIcon /></i><div><strong>Opis proizvoda</strong><span>Jasan opis pomaže kupcu pri izboru</span></div></div>
            <label className="product-editor__field"><span>Opis</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Namena, način primene, pakovanje i druge korisne informacije…" /></label>
          </section>

          <section className="product-editor__section product-editor__section--wide">
            <div className="product-editor__section-heading product-editor__section-heading--inline"><i aria-hidden="true"><PhotoLibraryOutlinedIcon /></i><div><strong>Fotografije</strong><span>Prva fotografija je glavna na kartici proizvoda</span></div><b>{previews.length}/{MAX_IMAGES}</b></div>
            <label className="product-editor__upload"><CloudUploadOutlinedIcon /><strong>Dodajte fotografije proizvoda</strong><span>JPG, PNG ili WEBP · najviše {MAX_IMAGES} fotografija</span><input type="file" accept="image/*" multiple onChange={handleImagesChange} disabled={previews.length >= MAX_IMAGES || loading} /></label>
            {previews.length > 0 ? <div className="product-editor__previews">{previews.map((preview, index) => <article key={preview.id}><img src={preview.url} alt={`Fotografija proizvoda ${index + 1}`} />{index === 0 && <span>Glavna</span>}<button type="button" onClick={() => removeImage(preview.id)} disabled={loading} aria-label={`Ukloni fotografiju ${index + 1}`}><CloseIcon /></button></article>)}</div> : <div className="product-editor__no-images"><ImageOutlinedIcon /><span>Još nema dodatih fotografija</span></div>}
          </section>
        </div>

        <footer className="product-editor__footer"><span>{loading && uploadProgress > 0 ? `Otpremanje fotografija ${Math.round(uploadProgress)}%` : duplicating ? 'Originalni proizvod neće biti izmenjen.' : 'Proverite podatke pre čuvanja.'}</span><div><button type="button" className="product-editor__cancel" onClick={onClose} disabled={loading}>Odustani</button><button type="submit" className="product-editor__save" disabled={loading}><SaveOutlinedIcon />{loading ? 'Čuvanje…' : editing ? 'Sačuvaj izmene' : duplicating ? 'Kreiraj novo pakovanje' : 'Dodaj proizvod'}</button></div></footer>
      </form>
    </div>
  );
}
