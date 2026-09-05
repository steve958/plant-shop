import { type ProductOptions } from '../../data/productOptions';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import heroImage from "../../assets/protect.jpg";
import protectionIcon from "../../assets/zastita/insekticidi-Green.png";
import nutritionIcon from "../../assets/ishrana/kristalna-Green.png";
import seedIcon from "../../assets/seme/povrce-Green.png";
import gardenIcon from "../../assets/garden/masine-Green.png";
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
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const heroImageRef = useRef<HTMLImageElement>(null);
  const [sortBy, setSortBy] = useState("nameAsc");
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const searchQuery = useSelector((state: RootState) => state.search.query);
  const navigate = useNavigate();
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

  useLayoutEffect(() => {
    const image = heroImageRef.current;
    if (image?.complete && image.naturalWidth > 0) setHeroImageLoaded(true);
  }, []);

  const isSearching = Boolean(searchQuery.trim());

  useEffect(() => {
    if (!isSearching) return;
    setManufacturerFilter([]);
    setFilterResetKey((key) => key + 1);
    const timer = window.setTimeout(scrollToProductCatalogue, 180);
    return () => window.clearTimeout(timer);
  }, [isSearching]);

  const searchedCatalogue = useMemo(
    () => isSearching ? products : products.filter((product) => product.onDiscount),
    [isSearching, products]
  );

  const availableManufacturers = useMemo(
    () =>
      Array.from(
        new Set(searchedCatalogue.map((product) => product.manufacturer).filter(Boolean))
      ),
    [searchedCatalogue]
  );

  const sortedProducts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase("sr-Latn");
    const filteredProducts = searchedCatalogue.filter((product) => {
      const matchesSearch = !normalizedSearch || [
        product.name,
        product.manufacturer,
        product.category,
        product.subcategory,
        product.packaging,
        product.description,
      ].some((value) => value?.toLocaleLowerCase("sr-Latn").includes(normalizedSearch));
      const matchesManufacturer =
        manufacturerFilter.length === 0 ||
        manufacturerFilter.includes(product.manufacturer);
      return matchesSearch && matchesManufacturer;
    });

    const getEffectivePrice = (product: Product) =>
      product.onDiscount && product.discountPrice
        ? product.discountPrice
        : product.price;

    return [...filteredProducts].sort((first, second) => {
      switch (sortBy) {
        case "nameDesc":
          return second.name.localeCompare(first.name);
        case "priceAsc":
          return getEffectivePrice(first) - getEffectivePrice(second);
        case "priceDesc":
          return getEffectivePrice(second) - getEffectivePrice(first);
        default:
          return first.name.localeCompare(second.name);
      }
    });
  }, [searchedCatalogue, searchQuery, manufacturerFilter, sortBy]);

  const handleAddToCart = (productId: string) => {
    const product = products.find((item) => item.productId === productId);
    if (!product || product.archived || product.availability === 'out_of_stock') return;
        if (product.packages?.length) { navigate(`/proizvod/${productId}`); return; }

    dispatch(
      addToCart({
        productId: product.productId,
        name: product.name + (product.packaging ? ` · ${product.packaging}` : ""),
        image: product.images?.[0] || "",
        price:
          product.onDiscount && product.discountPrice
            ? product.discountPrice
            : product.price,
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
      <section className="shop-hero">
        <div className="shop-home__shell shop-hero__grid">
          <div className="shop-hero__content">
            <span className="shop-eyebrow">Znanje. Posvećenost. Uspeh.</span>
            <h1>Od setve do berbe. Sve za vaš uspeh.</h1>
            <p>
              Zaštita i ishrana bilja, seme, sadnice i oprema za baštu.
              Izaberite proizvode i pakovanje koje vam odgovara.
            </p>
            <div className="shop-hero__actions">
              <a className="shop-button shop-button--primary" href="#akcija">
                Pogledajte ponudu
                <ArrowForwardIcon aria-hidden="true" />
              </a>
              <a
                className="shop-button shop-button--secondary"
                href="https://www.plantcentar.com/kontakt"
              >
                Pitajte stručnjaka
              </a>
            </div>
          </div>
          <figure className={`shop-hero__visual ${heroImageLoaded ? "shop-hero__visual--loaded" : ""}`}>
            <img
              ref={heroImageRef}
              src={heroImage}
              alt="Mlada biljka u kvalitetno pripremljenom zemljištu"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setHeroImageLoaded(true)}
            />
            <div className="hero-offer-grid">{featuredCategories.map((category) => <button key={category.label} onClick={() => navigate(`/kategorija/${category.label === 'Garden program' ? 'Garden oprema i alati' : category.label}`)}><img src={category.icon} alt="" /><strong>{category.label}</strong><span>Istražite ponudu ↗</span></button>)}</div>
            <figcaption>
              <span>Plant Centar preporuka</span>
              <strong>Pravi proizvod u pravo vreme</strong>
            </figcaption>
          </figure>
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

      <section className="shop-products" id="akcija" data-product-catalogue>
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
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      onClick={(productId) => navigate(`/proizvod/${productId}`)}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
