import { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import "./Home.css";
import { ScaleLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import Sort from "../Sort/Sort";
import Filter from "../Filter/Filter"; // <-- Your refactored Filter
import ProductCard from "../ProductCard/ProductCard";

type Product = {
  productId: string;
  name: string;
  price: number;
  images: string[];
  type: string;
  category: string;
  gender: string;
  size: string[];
  manufacturer: string;
  onDiscount?: boolean;
  discountPrice?: number;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting
  const [sortBy, setSortBy] = useState<string>("nameAsc");

  // Filter: list of manufacturers selected by the user
  const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([]);

  // Global search query from Redux
  const searchQuery = useSelector((state: RootState) => state.search.query);

  // For navigation on product click
  const navigate = useNavigate();

  // 1) Fetch only discounted products from Firestore on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "products"),
          where("onDiscount", "==", true)
        );
        const querySnapshot = await getDocs(q);

        // Map each doc into a Product object
        const fetchedProducts: Product[] = querySnapshot.docs.map((doc) => ({
          productId: doc.id,
          ...doc.data(),
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

  // 2) Calculate unique manufacturer list for the Filter
  const availableManufacturers = useMemo(() => {
    const uniqueSet = new Set<string>();
    products.forEach((p) => {
      if (p.manufacturer) {
        uniqueSet.add(p.manufacturer);
      }
    });
    return Array.from(uniqueSet);
  }, [products]);

  // 3) Filter
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // If user hasn't selected any manufacturers, we show all
      const matchesManufacturer =
        manufacturerFilter.length === 0 ||
        manufacturerFilter.includes(product.manufacturer);

      return matchesSearch && matchesManufacturer;
    });
  }, [products, searchQuery, manufacturerFilter]);

  // 4) Sort
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    // For convenience, define a helper to get effective price:
    const getEffectivePrice = (p: Product) =>
      p.onDiscount && p.discountPrice ? p.discountPrice : p.price;

    switch (sortBy) {
      case "nameDesc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "priceAsc":
        sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
        break;
      case "priceDesc":
        sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
        break;
      default: // nameAsc
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [filteredProducts, sortBy]);

  // 5) Handlers for Sort/Filter
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleFilterChange = (filters: { manufacturers: string[] }) => {
    setManufacturerFilter(filters.manufacturers);
  };

  // 6) Navigate on product click
  const handleProductClick = (productId: string) => {
    navigate(`/proizvod/${productId}`);
  };

  // 7) Render
  return (
    <div className="home-page-container">
      {loading ? (
        <div className="loader">
          <ScaleLoader color="#54C143" />
        </div>
      ) : (
        <div className="home-page-wrapper">
          {/* Sidebar: Sort + Filter */}
          <div className="sidebar">
            <div className="sort-filter-wrapper">
              <Sort onSortChange={handleSortChange} />
              <Filter
                onFilterChange={handleFilterChange}
                availableManufacturers={availableManufacturers}
              />
            </div>
          </div>

          {/* Main product grid */}
          <div className="home-main-content">
            <div className="home-products-grid">
              {sortedProducts.length === 0 ? (
                <div className="empty-message">
                  Nema proizvoda po datom kriterijumu
                </div>
              ) : (
                sortedProducts.map((product) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    onClick={handleProductClick}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
