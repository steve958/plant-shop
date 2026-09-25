import { type PackageOption, type ProductOptions, discountedOffers, effectivePackagePrice, effectivePrice } from '../../data/productOptions';
import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useNavigationType } from "react-router-dom";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { RootState } from "../Redux/store";
import { addToCart } from "../Redux/cartSlice";
import Sort from "../Sort/Sort";
import Filter from "../Filter/Filter";
import ProductCard from "../ProductCard/ProductCard";
import Loader from "../Loader/Loader";
import heroImage from "../../assets/1000051751.png";
import protectionIcon from "../../assets/zastita/insekticidi-Green.png";
import nutritionIcon from "../../assets/ishrana/kristalna-Green.png";
import seedIcon from "../../assets/seme/povrce-Green.png";
import gardenIcon from "../../assets/garden/masine-Green.png";
import supportImage from "../../assets/protect.jpg";
import { scrollToProductCatalogue } from "../scrollToProductCatalogue";
import "./Home.css";

type Product = ProductOptions & {
  productId: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  manufacturer: string;
  packaging?: string;
  description?: string;
  onDiscount?: boolean;
  discountPrice?: number;
  createdAt?: { seconds?: number; toMillis?: () => number } | null;
};

const featuredCategories = [
  {
    label: "Zaštita bilja",
    description: "Preparati za pouzdanu i odgovornu zaštitu useva.",
    route: "/podkategorija/Insekticidi",
    icon: protectionIcon,
  },
  {
    label: "Ishrana bilja",
    description: "Programi ishrane za zdrav rast i stabilan prinos.",
    route: "/podkategorija/Kristalna vodootopiva đubriva",
    icon: nutritionIcon,
  },
  {
    label: "Seme i sadnice",
    description: "Proveren izbor za profesionalnu i hobi proizvodnju.",
    route: "/podkategorija/Seme povrtarskih kultura",
    icon: seedIcon,
  },
  {
    label: "Garden program",
    description: "Alati, mašine i oprema za dvorište i imanje.",
    route: "/podkategorija/Mašine",
    icon: gardenIcon,
  },
];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("nameAsc");
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const searchQuery = useSelector((state: RootState) => state.search.query);
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = querySnapshot.docs.map((document) => ({
          productId: document.id,
          ...document.data(),
        })) as Product[];
        setProducts(fetchedProducts.filter((product) => !product.archived));
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const isSearching = Boolean(searchQuery.trim());

  useEffect(() => {
    if (!isSearching || navigationType === "POP") return;
    setManufacturerFilter([]);
    setFilterResetKey((key) => key + 1);
    const timer = window.setTimeout(scrollToProductCatalogue, 180);
    return () => window.clearTimeout(timer);
  }, [isSearching, navigationType]);

  // While browsing "Akcija", every discounted package is shown as its own article.
  const searchedCatalogue = useMemo(
    () => isSearching
      ? products.map((product) => ({ product, packageOption: undefined as PackageOption | undefined }))
      : discountedOffers(products),
    [isSearching, products]
  );

  const availableManufacturers = useMemo(
    () =>
      Array.from(
        new Set(searchedCatalogue.map(({ product }) => product.manufacturer).filter(Boolean))
      ),
    [searchedCatalogue]
  );

  const sortedProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase("sr-Latn");
    const filteredProducts = searchedCatalogue.filter(({ product, packageOption }) => {
      const matchesSearch = !normalizedSearch || [
        product.name,
        product.manufacturer,
        product.category,
        product.subcategory,
        packageOption?.label ?? product.packaging,
        product.description,
      ].some((value) => value?.toLocaleLowerCase("sr-Latn").includes(normalizedSearch));
      const matchesManufacturer =
        manufacturerFilter.length === 0 ||
        manufacturerFilter.includes(product.manufacturer);
      return matchesSearch && matchesManufacturer;
    });

    const getEffectivePrice = ({ product, packageOption }: (typeof filteredProducts)[number]) =>
      packageOption ? effectivePackagePrice(packageOption) : effectivePrice(product);

    return [...filteredProducts].sort((first, second) => {
      switch (sortBy) {
        case "nameDesc":
          return second.product.name.localeCompare(first.product.name) || getEffectivePrice(first) - getEffectivePrice(second);
        case "priceAsc":
          return getEffectivePrice(first) - getEffectivePrice(second);
        case "priceDesc":
          return getEffectivePrice(second) - getEffectivePrice(first);
        default:
          return first.product.name.localeCompare(second.product.name) || getEffectivePrice(first) - getEffectivePrice(second);
      }
    });
  }, [searchedCatalogue, searchQuery, manufacturerFilter, sortBy]);

  const seasonalProducts = useMemo(
    () => products.filter((product) => product.seasonal),
    [products]
  );

  const recentProducts = useMemo(() => {
    const createdAtMillis = (product: Product) => {
      const value = product.createdAt;
      if (!value) return 0;
      if (typeof value.toMillis === "function") return value.toMillis();
      return typeof value.seconds === "number" ? value.seconds * 1000 : 0;
    };
    return [...products].sort((first, second) => createdAtMillis(second) - createdAtMillis(first)).slice(0, 8);
  }, [products]);

  const openProduct = (productId: string, packageId?: string) =>
    navigate(`/proizvod/${productId}${packageId ? `?pakovanje=${encodeURIComponent(packageId)}` : ""}`);

  const handleAddToCart = (productId: string, packageId?: string) => {
    const product = products.find((item) => item.productId === productId);
    if (!product || product.archived) return;
    const selectedPackage = packageId ? product.packages?.find((option) => option.id === packageId) : undefined;
    if (selectedPackage) {
      if (selectedPackage.availability === 'out_of_stock') return;
      dispatch(
        addToCart({
          productId: product.productId,
          packageId: selectedPackage.id,
          name: `${product.name} · ${selectedPackage.label}`,
          image: product.images?.[0] || "",
          price: effectivePackagePrice(selectedPackage),
          quantity: 1,
        })
      );
      toast.success("Proizvod je dodat u korpu.");
      return;
    }
    if (product.packages?.length) { openProduct(productId); return; }
    if (product.availability === 'out_of_stock') return;

    dispatch(
      addToCart({
        productId: product.productId,
        name: product.name + (product.packaging ? ` · ${product.packaging}` : ""),
        image: product.images?.[0] || "",
        price: effectivePrice(product),
        quantity: 1,
      })
    );
    toast.success("Proizvod je dodat u korpu.");
  };

  const handleFilterChange = useCallback(
    (filters: { manufacturers: string[] }) => {
      setManufacturerFilter(filters.manufacturers);
    },
    []
  );

  return (
    <main className="shop-home">
      <section className="shop-banner" aria-label="Plant Centar webshop">
        <h1 className="sr-only">Sve za vas i vašu proizvodnju na jednom mestu</h1>
        <img
          className="shop-banner__image"
          src={heroImage}
          alt="Plant Centar — sve za vas i vašu proizvodnju na jednom mestu. Zaštita bilja, ishrana bilja, seme i sadnice, garden oprema i alati."
          width={1774}
          height={887}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="shop-banner__actions">
          <a className="shop-button shop-button--primary" href="#akcija">Pogledajte ponudu <ArrowForwardIcon aria-hidden="true" /></a>
          <a className="shop-button shop-button--secondary" href="https://www.plantcentar.com/kontakt">Pitajte stručnjaka</a>
        </div>
      </section>

      <section className="shop-assurances" aria-label="Prednosti kupovine">
        <div className="shop-home__shell shop-assurances__grid">
          <div>
            <VerifiedOutlinedIcon aria-hidden="true" />
            <span><strong>Proveren asortiman</strong>Originalni proizvodi pouzdanih brendova</span>
          </div>
          <div>
            <SupportAgentOutlinedIcon aria-hidden="true" />
            <span><strong>Stručna podrška</strong>Pomoć pri izboru i primeni proizvoda</span>
          </div>
          <div>
            <LocalShippingOutlinedIcon aria-hidden="true" />
            <span><strong>Sigurna dostava</strong>Pažljivo pakovanje i isporuka širom Srbije</span>
          </div>
        </div>
      </section>

      <section className="shop-categories">
        <div className="shop-home__shell">
          <header className="shop-section-heading">
            <div>
              <span className="shop-eyebrow">Izdvajamo iz ponude</span>
              <h2>Izaberite program</h2>
            </div>
            <p>Brži put do proizvoda prema poslu koji danas obavljate.</p>
          </header>
          <div className="shop-categories__grid">
            {featuredCategories.map((category) => (
              <button
                key={category.label}
                className="shop-category-card"
                type="button"
                onClick={() => navigate(`/kategorija/${category.label === 'Garden program' ? 'Garden oprema i alati' : category.label}`)}
              >
                <span className="shop-category-card__icon">
                  <img src={category.icon} alt="" loading="lazy" decoding="async" />
                </span>
                <span className="shop-category-card__copy">
                  <strong>{category.label}</strong>
                  <small>{category.description}</small>
                </span>
                <ArrowForwardIcon aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="shop-products" id="akcija" data-product-catalogue aria-busy={loading}>
        <div className="shop-home__shell">
          <header className="shop-section-heading shop-section-heading--products">
            <div>
              <span className="shop-eyebrow">{searchQuery.trim() ? "Globalna pretraga" : "Aktuelna ponuda"}</span>
              <h2>{searchQuery.trim() ? `Rezultati za „${searchQuery.trim()}“` : "Proizvodi na akciji"}</h2>
            </div>
            <p>{searchQuery.trim() ? `Pronađeno proizvoda: ${sortedProducts.length}` : "Sezonski izbor proizvoda sa povoljnijim cenama."}</p>
          </header>

          <div className="shop-products__layout">
            <aside className="shop-filter-panel">
              <Sort onSortChange={setSortBy} />
              <Filter
                onFilterChange={handleFilterChange}
                availableManufacturers={availableManufacturers}
                resetKey={filterResetKey}
              />
            </aside>

            <div className="shop-products__content">
              {loading ? (
                <Loader compact label="Učitavamo proizvode" />
              ) : sortedProducts.length === 0 ? (
                <div className="shop-empty-state">
                  <strong>Trenutno nema proizvoda po ovom kriterijumu.</strong>
                  <span>Promenite filter ili pokušajte drugu pretragu.</span>
                </div>
              ) : (
                <div className="home-products-grid">
                  {sortedProducts.map(({ product, packageOption }) => (
                    <ProductCard
                      key={`${product.productId}-${packageOption?.id ?? ""}`}
                      product={product}
                      packageOption={packageOption}
                      onClick={openProduct}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!isSearching && seasonalProducts.length > 0 && (
        <section className="shop-rail" aria-label="Aktuelna sezonska ponuda">
          <div className="shop-home__shell">
            <header className="shop-section-heading">
              <div>
                <span className="shop-eyebrow">Sezonski izbor</span>
                <h2>Aktuelna sezonska ponuda</h2>
              </div>
              <p>Proizvodi koje u ovom delu sezone najčešće traže proizvođači i baštovani.</p>
            </header>
            <div className="shop-rail__grid">
              {seasonalProducts.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onClick={(productId) => navigate(`/proizvod/${productId}`)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {!isSearching && (
        <section className="shop-support" aria-label="Stručna podrška">
          <div className="shop-home__shell">
            <div className="shop-support__card">
              <div className="shop-support__copy">
                <span className="shop-eyebrow">Plant Centar tim</span>
                <h2>Potrebna vam je stručna podrška?</h2>
                <p>Naši savetnici vam pomažu pri izboru proizvoda, doziranju i primeni — besplatno, uz svaku kupovinu.</p>
                <a className="shop-button shop-button--primary" href="https://www.plantcentar.com/kontakt">Kontaktirajte nas <ArrowForwardIcon aria-hidden="true" /></a>
              </div>
              <img className="shop-support__image" src={supportImage} alt="Ruke drže zemlju sa mladim izdankom" loading="lazy" decoding="async" />
            </div>
          </div>
        </section>
      )}

      {!isSearching && recentProducts.length > 0 && (
        <section className="shop-rail shop-rail--recent" aria-label="Nedavno dodati proizvodi">
          <div className="shop-home__shell">
            <header className="shop-section-heading">
              <div>
                <span className="shop-eyebrow">Novo u ponudi</span>
                <h2>Nedavno dodati proizvodi</h2>
              </div>
              <p>Najnoviji artikli u Plant Centar asortimanu.</p>
            </header>
            <div className="shop-rail__grid">
              {recentProducts.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onClick={(productId) => navigate(`/proizvod/${productId}`)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
