import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
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
import "./Home.css";

type Product = {
  productId: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  manufacturer: string;
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
  const [sortBy, setSortBy] = useState("nameAsc");
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);
  const searchQuery = useSelector((state: RootState) => state.search.query);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsQuery = query(
          collection(db, "products"),
          where("onDiscount", "==", true)
        );
        const querySnapshot = await getDocs(productsQuery);
        const fetchedProducts = querySnapshot.docs.map((document) => ({
          productId: document.id,
          ...document.data(),
        })) as Product[];
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const availableManufacturers = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.manufacturer).filter(Boolean))
      ),
    [products]
  );

  const sortedProducts = useMemo(() => {
    const filteredProducts = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
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
  }, [products, searchQuery, manufacturerFilter, sortBy]);

  const handleAddToCart = (productId: string) => {
    const product = products.find((item) => item.productId === productId);
    if (!product) return;

    dispatch(
      addToCart({
        productId: product.productId,
        name: product.name,
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
            <h1>Sve što vašoj proizvodnji treba, na jednom mestu.</h1>
            <p>
              Proveren asortiman, stručna podrška i proizvodi iza kojih stoji
              Plant Centar iskustvo.
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
              src={heroImage}
              alt="Mlada biljka u kvalitetno pripremljenom zemljištu"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onLoad={() => setHeroImageLoaded(true)}
            />
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
                onClick={() => navigate(category.route)}
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

      <section className="shop-products" id="akcija">
        <div className="shop-home__shell">
          <header className="shop-section-heading shop-section-heading--products">
            <div>
              <span className="shop-eyebrow">Aktuelna ponuda</span>
              <h2>Proizvodi na akciji</h2>
            </div>
            <p>Sezonski izbor proizvoda sa povoljnijim cenama.</p>
          </header>

          <div className="shop-products__layout">
            <aside className="shop-filter-panel">
              <Sort onSortChange={setSortBy} />
              <Filter
                onFilterChange={handleFilterChange}
                availableManufacturers={availableManufacturers}
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
